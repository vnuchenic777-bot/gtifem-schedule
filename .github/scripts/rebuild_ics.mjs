#!/usr/bin/env node
/**
 * Перепарсивает HTML-страницы расписания из _tmp_html/ и обновляет .ics
 * файлы в api/schedule/teacher/ и api/schedule/group/.
 *
 * Логика: для каждого .ics мержим существующий с новым по UID.
 * Старые события сохраняются, новые добавляются. Никогда не удаляем
 * данные одним сбойным запуском — только дополняем.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = (() => {
  const a = { htmlDir: "_tmp_html", teachersOut: "api/schedule/teacher", groupsOut: "api/schedule/group" };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--html-dir") a.htmlDir = argv[++i];
    else if (argv[i] === "--teachers-out") a.teachersOut = argv[++i];
    else if (argv[i] === "--groups-out") a.groupsOut = argv[++i];
  }
  return a;
})();

const now = new Date();
const academicYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;

const MONTH_TO_NUM = {
  "январ": 1, "феврал": 2, "март": 3, "апрел": 4, "май": 5, "мая": 5,
  "июн": 6, "июл": 7, "август": 8, "сентябр": 9, "октябр": 10, "ноябр": 11, "декабр": 12
};

const pad = (n) => String(n).padStart(2, "0");
const escIcs = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const stripTags = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const subjSlug = (s) => s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").slice(0, 30);
const groupSlugOf = (g) => String(g).replace(/[^a-zа-я0-9]+/gi, "-");

function monthNum(name) {
  const low = name.toLowerCase();
  for (const [k, v] of Object.entries(MONTH_TO_NUM)) if (low.startsWith(k.slice(0, 4))) return v;
  return null;
}

// === Парсер: формат преподавателя (/raspisanie-prepodavateley/) ===
function parseTeacherHtml(html) {
  const events = [];
  const tableMatch = html.match(/<div id="raspisanie">[\s\S]*?<table>([\s\S]*?)<\/table>/);
  if (!tableMatch) return events;
  const weekParts = tableMatch[1].split(/<tr class="lesson-line">/);
  for (let i = 1; i < weekParts.length; i += 1) {
    const wHtml = weekParts[i];
    const headerMatch = wHtml.match(/^([\s\S]*?)<\/tr>/);
    if (!headerMatch) continue;
    const cellMatches = [...headerMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => stripTags(m[1]));
    const dates = [];
    for (let j = 1; j < cellMatches.length; j += 1) {
      const cell = cellMatches[j];
      const m = cell.match(/(\d{1,2})\s+([А-Яа-яёЁ]+)/);
      if (!m) { dates.push(null); continue; }
      const mn = monthNum(m[2]);
      if (!mn) { dates.push(null); continue; }
      const year = mn >= 9 ? academicYear : academicYear + 1;
      dates.push({ year, month: mn, day: parseInt(m[1], 10) });
    }
    const restHtml = wHtml.slice(headerMatch[0].length);
    const rowMatches = [...restHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
    for (const rm of rowMatches) {
      const cells = [...rm[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
      if (cells.length < 2) continue;
      for (let k = 0; k < cells.length - 1 && k < dates.length; k += 1) {
        const date = dates[k];
        if (!date) continue;
        const inner = cells[k + 1][1];
        const tM = inner.match(/<b>\s*(\d{1,2}):(\d{2})\s*[-—–]\s*(\d{1,2}):(\d{2})\s*<\/b>/);
        if (!tM) continue;
        const start = pad(tM[1]) + tM[2], end = pad(tM[3]) + tM[4];
        const afterB = inner.split(/<\/b>/i)[1] || "";
        const parts = afterB.split(/<br\s*\/?>/i).map(p => stripTags(p)).filter(Boolean);
        if (parts.length < 3) continue;
        const [subject, group, aud, number = ""] = parts;
        events.push({ date, start, end, subject, group, aud, number });
      }
    }
  }
  return events;
}

// === Парсер: формат группы (/raspisanie/) ===
function parseGroupHtml(html) {
  const events = [];
  const tdRe = /<td\b([^>]*data-time="([^"]+)"[^>]*)>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = tdRe.exec(html)) !== null) {
    const attrs = m[1], time = m[2], inner = m[3];
    const day = (attrs.match(/data-day="(\d+)"/) || [])[1];
    const month = (attrs.match(/data-month="([^"]+)"/) || [])[1];
    const groupRaw = (attrs.match(/data-group="([^"]+)"/) || [])[1];
    if (!day || !month || !groupRaw) continue;
    const subjMatch = inner.match(/<div class="subject">([\s\S]*?)<\/div>/);
    const subject = subjMatch ? stripTags(subjMatch[1]) : "";
    if (!subject) continue;
    const audMatch = inner.match(/<div class="aud">[\s\S]*?<b>([\s\S]*?)<\/b>/);
    const aud = audMatch ? stripTags(audMatch[1]) : "";
    const numMatch = inner.match(/<div class="number">([\s\S]*?)<\/div>/);
    const number = numMatch ? stripTags(numMatch[1]) : "";
    const teacherMatch = inner.match(/<\/div>\s*([^<]+?)\s*<div class="number">/);
    const teacher = teacherMatch ? teacherMatch[1].replace(/\.\s*\./g, "").replace(/\s+/g, " ").trim() : "";
    const tm = time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!tm) continue;
    const start = pad(tm[1]) + tm[2], end = pad(tm[3]) + tm[4];
    const mn = monthNum(month);
    if (!mn) continue;
    const year = mn >= 9 ? academicYear : academicYear + 1;
    for (const g of String(groupRaw).split(",").map(s => s.trim()).filter(Boolean)) {
      events.push({ date: { year, month: mn, day: parseInt(day, 10) }, start, end, subject, aud, teacher, number, group: g });
    }
  }
  return events;
}

// === Генератор ICS ===
function makeIcs(name, kind, events) {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    `PRODID:-//FEM SPbGTI//${kind === "teacher" ? "Teacher" : "Group"} Schedule v3//RU`,
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${kind === "teacher" ? "Расписание " + name + " (ФЭМ)" : "Расписание группы " + name + " (ФЭМ)"}`,
    "X-WR-TIMEZONE:Europe/Moscow",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
    "BEGIN:VTIMEZONE", "TZID:Europe/Moscow",
    "BEGIN:STANDARD", "TZOFFSETFROM:+0300", "TZOFFSETTO:+0300", "TZNAME:MSK",
    "DTSTART:19700101T000000", "END:STANDARD", "END:VTIMEZONE"
  ];
  for (const ev of events) {
    const dateStr = ev.date.year + pad(ev.date.month) + pad(ev.date.day);
    let summary, desc, uid, categories;
    if (kind === "teacher") {
      summary = `${ev.subject} · гр. ${ev.group}${ev.aud ? " · " + ev.aud : ""}`;
      desc = [`Группа: ${ev.group}`, ev.aud ? `Аудитория: ${ev.aud}` : "", ev.number ? `Пара №${ev.number}` : "", `Преподаватель: ${name}`].filter(Boolean).join("\n");
      uid = `teacher-${dateStr}-${ev.start}-${groupSlugOf(ev.group)}-${subjSlug(ev.subject)}@gtifem.ru`;
      categories = "Преподавание," + escIcs(String(ev.group));
    } else {
      summary = `${ev.subject}${ev.teacher ? " · " + ev.teacher : ""}${ev.aud ? " · " + ev.aud : ""}`;
      desc = [`Группа: ${ev.group}`, ev.teacher ? `Преподаватель: ${ev.teacher}` : "", ev.aud ? `Аудитория: ${ev.aud}` : "", ev.number ? `Пара №${ev.number}` : ""].filter(Boolean).join("\n");
      uid = `group-${ev.group}-${dateStr}-${ev.start}-${subjSlug(ev.subject)}@gtifem.ru`;
      categories = "Учёба," + escIcs(ev.group);
    }
    lines.push("BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/Moscow:${dateStr}T${ev.start}00`,
      `DTEND;TZID=Europe/Moscow:${dateStr}T${ev.end}00`,
      `SUMMARY:${escIcs(summary)}`);
    if (ev.aud) lines.push(`LOCATION:${escIcs(ev.aud)}`);
    lines.push(`DESCRIPTION:${escIcs(desc)}`, `CATEGORIES:${categories}`, "STATUS:CONFIRMED", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(l => l.length <= 75 ? l : (() => {
    const parts = [l.slice(0, 75)]; let r = l.slice(75);
    while (r.length > 74) { parts.push(" " + r.slice(0, 74)); r = r.slice(74); }
    if (r) parts.push(" " + r); return parts.join("\r\n");
  })()).join("\r\n") + "\r\n";
}

// === Merge по UID, новые приоритетнее ===
function mergeIcsTexts(oldText, newText) {
  function extract(text) {
    const out = []; const re = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g; let mm;
    while ((mm = re.exec(text)) !== null) {
      const uidM = mm[0].match(/UID:([^\r\n]+)/);
      out.push({ uid: uidM ? uidM[1].trim() : "", block: mm[0] });
    }
    return out;
  }
  const newEv = extract(newText), oldEv = extract(oldText);
  const seen = new Set(); const merged = [];
  for (const e of newEv) if (e.uid && !seen.has(e.uid)) { seen.add(e.uid); merged.push(e.block); }
  for (const e of oldEv) if (e.uid && !seen.has(e.uid)) { seen.add(e.uid); merged.push(e.block); }
  merged.sort((a, b) => {
    const sa = (a.match(/DTSTART;TZID=Europe\/Moscow:(\d{8}T\d{6})/) || [])[1] || "";
    const sb = (b.match(/DTSTART;TZID=Europe\/Moscow:(\d{8}T\d{6})/) || [])[1] || "";
    return sa.localeCompare(sb);
  });
  const headerEnd = newText.indexOf("BEGIN:VEVENT");
  const header = headerEnd > 0 ? newText.slice(0, headerEnd) : "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n";
  return header + merged.join("\r\n") + "\r\nEND:VCALENDAR\r\n";
}

function teacherNameFromIcs(text) {
  const m = text.match(/X-WR-CALNAME:Расписание\s+(.+?)\s+\(ФЭМ\)/);
  return m ? m[1].trim() : "";
}

async function main() {
  const tDir = resolve(args.htmlDir, "teachers");
  const gDir = resolve(args.htmlDir, "groups");

  let tUpd = 0, tSame = 0;
  if (existsSync(tDir)) {
    for (const slug of readdirSync(tDir)) {
      const folder = resolve(tDir, slug);
      if (!statSync(folder).isDirectory()) continue;
      const htmls = readdirSync(folder).filter(f => f.endsWith(".html"));
      if (!htmls.length) continue;
      const all = [];
      for (const f of htmls) {
        try {
          const html = readFileSync(resolve(folder, f), "utf8").normalize("NFC");
          all.push(...parseTeacherHtml(html));
        } catch (e) {}
      }
      if (!all.length) continue;
      const targetPath = resolve(args.teachersOut, `${slug}.ics`);
      let teacherName = slug;
      if (existsSync(targetPath)) teacherName = teacherNameFromIcs(readFileSync(targetPath, "utf8")) || slug;
      const newIcs = makeIcs(teacherName, "teacher", all);
      if (existsSync(targetPath)) {
        const old = readFileSync(targetPath, "utf8");
        const merged = mergeIcsTexts(old, newIcs);
        if (merged !== old) { writeFileSync(targetPath, merged, "utf8"); tUpd++; } else { tSame++; }
      } else {
        mkdirSync(args.teachersOut, { recursive: true });
        writeFileSync(targetPath, newIcs, "utf8"); tUpd++;
      }
    }
  }
  console.log(`Преподаватели: обновлено ${tUpd}, без изменений ${tSame}`);

  let gUpd = 0, gSame = 0;
  if (existsSync(gDir)) {
    for (const group of readdirSync(gDir)) {
      const folder = resolve(gDir, group);
      if (!statSync(folder).isDirectory()) continue;
      const htmls = readdirSync(folder).filter(f => f.endsWith(".html"));
      if (!htmls.length) continue;
      const all = [];
      for (const f of htmls) {
        try {
          const html = readFileSync(resolve(folder, f), "utf8").normalize("NFC");
          all.push(...parseGroupHtml(html).filter(e => e.group === group));
        } catch (e) {}
      }
      if (!all.length) continue;
      const targetPath = resolve(args.groupsOut, `${group}.ics`);
      const newIcs = makeIcs(group, "group", all);
      if (existsSync(targetPath)) {
        const old = readFileSync(targetPath, "utf8");
        const merged = mergeIcsTexts(old, newIcs);
        if (merged !== old) { writeFileSync(targetPath, merged, "utf8"); gUpd++; } else { gSame++; }
      } else {
        mkdirSync(args.groupsOut, { recursive: true });
        writeFileSync(targetPath, newIcs, "utf8"); gUpd++;
      }
    }
  }
  console.log(`Группы: обновлено ${gUpd}, без изменений ${gSame}`);
}

main().catch(e => { console.error("✗", e); process.exit(1); });
