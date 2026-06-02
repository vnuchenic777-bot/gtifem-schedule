#!/usr/bin/env node
/**
 * Пересобирает api/schedule/groups.json и teachers.json — индексы
 * для страницы подписки. Берёт фактические ICS-файлы из репо.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";

const TEACHERS_DIR = "api/schedule/teacher";
const GROUPS_DIR = "api/schedule/group";
const TEACHERS_JSON = "api/schedule/teachers.json";
const GROUPS_JSON = "api/schedule/groups.json";

function parseTeacherIcs(path) {
  const text = readFileSync(path, "utf8");
  const lessons = (text.match(/BEGIN:VEVENT/g) || []).length;
  const nameMatch = text.match(/X-WR-CALNAME:Расписание\s+([^\(]+?)\s+\(ФЭМ\)/);
  const name = nameMatch ? nameMatch[1].trim() : basename(path, ".ics");
  const groupsSet = new Set();
  const re = /CATEGORIES:Преподавание,(.+?)(?:\r|\n)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const cat = m[1].trim();
    if (cat) groupsSet.add(cat);
  }
  return { name, lessons, groups: Array.from(groupsSet).sort() };
}

function listGroups() {
  if (!existsSync(GROUPS_DIR)) return [];
  return readdirSync(GROUPS_DIR)
    .filter(f => /^[0-9]+\.ics$/.test(f))
    .map(f => f.replace(/\.ics$/, ""))
    .sort();
}

function listTeachers() {
  if (!existsSync(TEACHERS_DIR)) return [];
  return readdirSync(TEACHERS_DIR)
    .filter(f => f.endsWith(".ics") && /^[a-z0-9._-]+$/.test(f))
    .map(f => {
      const slug = f.replace(/\.ics$/, "");
      try {
        const meta = parseTeacherIcs(resolve(TEACHERS_DIR, f));
        return { slug, ...meta };
      } catch (e) {
        return { slug, name: slug, lessons: 0, groups: [] };
      }
    });
}

const groups = listGroups();
const teachers = listTeachers();

writeFileSync(GROUPS_JSON, JSON.stringify({ ok: true, groups }, null, 2));
writeFileSync(TEACHERS_JSON, JSON.stringify({ ok: true, teachers }, null, 2));

console.log(`✓ groups.json (${groups.length}) и teachers.json (${teachers.length}) обновлены`);
