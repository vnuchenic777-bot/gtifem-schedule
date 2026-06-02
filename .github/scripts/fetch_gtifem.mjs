#!/usr/bin/env node
/**
 * Скачивает с gtifem.ru актуальные страницы расписания для всех преподавателей
 * (из teachers.json) и всех групп (из groups.json), за все месяцы учебного года.
 *
 * Этот скрипт безопасен: он не публикует чужой контент, а только использует
 * данные расписания для регенерации ICS-файлов в этом репозитории.
 *
 * Запуск (из корня репо):
 *   node .github/scripts/fetch_gtifem.mjs --out-dir _tmp_html \
 *     --teachers-list api/schedule/teachers.json \
 *     --groups-list api/schedule/groups.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = (() => {
  const a = { outDir: "_tmp_html", teachersList: "", groupsList: "" };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out-dir") a.outDir = argv[++i];
    else if (argv[i] === "--teachers-list") a.teachersList = argv[++i];
    else if (argv[i] === "--groups-list") a.groupsList = argv[++i];
  }
  return a;
})();

const UA = "Mozilla/5.0 (compatible; ScheduleSync/1.0; +https://github.com/vnuchenic777-bot/gtifem-schedule)";
const BASE = "https://gtifem.ru";

// Учебный год: с сентября — текущий, иначе предыдущий
const now = new Date();
const academicYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;

// Месяцы учебного года в URL-параметре ?month=...
const MONTHS = [
  "сентябрь", "октябрь", "ноябрь", "декабрь",
  "январь", "февраль", "март", "апрель",
  "май", "июнь", "июль"
];

async function fetchText(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.length < 500) throw new Error(`response too small (${text.length}b)`);
      return text;
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

// Лёгкий rate limit — пауза между запросами, чтобы не перегружать gtifem.ru
const SLEEP_MS = 250;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  mkdirSync(args.outDir, { recursive: true });
  mkdirSync(resolve(args.outDir, "teachers"), { recursive: true });
  mkdirSync(resolve(args.outDir, "groups"), { recursive: true });

  let okT = 0, failT = 0, okG = 0, failG = 0;

  // 1) Преподаватели
  if (args.teachersList && existsSync(args.teachersList)) {
    const data = JSON.parse(readFileSync(args.teachersList, "utf8"));
    const teachers = data.teachers || [];
    console.log(`→ Преподаватели: ${teachers.length}`);
    for (const t of teachers) {
      const slug = t.slug;
      if (!slug || !/^[a-z0-9-]+$/.test(slug)) continue;
      mkdirSync(resolve(args.outDir, "teachers", slug), { recursive: true });
      let anyMonth = false;
      for (const m of MONTHS) {
        const url = `${BASE}/dekanat/raspisanie-prepodavateley/${slug}/?month=${encodeURIComponent(m)}`;
        try {
          const html = await fetchText(url);
          writeFileSync(resolve(args.outDir, "teachers", slug, `${m}.html`), html, "utf8");
          anyMonth = true;
        } catch (e) {
          // Не каждый slug может существовать на gtifem.ru — пропускаем тихо
        }
        await sleep(SLEEP_MS);
      }
      if (anyMonth) okT += 1; else failT += 1;
      if ((okT + failT) % 10 === 0) console.log(`  обработано: ${okT + failT} / ${teachers.length}`);
    }
  }

  // 2) Группы (на gtifem.ru групповое расписание открывается через POST с группой,
  //   попробуем GET с параметром — если не сработает, fail tihoho)
  if (args.groupsList && existsSync(args.groupsList)) {
    const data = JSON.parse(readFileSync(args.groupsList, "utf8"));
    const groups = data.groups || [];
    console.log(`→ Группы: ${groups.length}`);
    for (const g of groups) {
      mkdirSync(resolve(args.outDir, "groups", g), { recursive: true });
      let anyMonth = false;
      for (const m of MONTHS) {
        const url = `${BASE}/dekanat/raspisanie/?group=${encodeURIComponent(g)}&month=${encodeURIComponent(m)}`;
        try {
          const html = await fetchText(url);
          writeFileSync(resolve(args.outDir, "groups", g, `${m}.html`), html, "utf8");
          anyMonth = true;
        } catch (e) {
          // ok, skip
        }
        await sleep(SLEEP_MS);
      }
      if (anyMonth) okG += 1; else failG += 1;
    }
  }

  console.log(`\n✓ Скачивание завершено: преподавателей ${okT}/${okT + failT}, групп ${okG}/${okG + failG}`);
}

main().catch((e) => { console.error("✗", e); process.exit(1); });
