# Расписание ФЭМ СПбГТИ (ТУ) — публичные подписки

Статический сайт расписания на GitHub Pages.

## Структура

- `/` — страница подписки (index.html)
- `/api/schedule/groups.json` — список групп
- `/api/schedule/teachers.json` — список преподавателей
- `/api/schedule/group/{N}.ics` — ICS группы (например 6411.ics)
- `/api/schedule/teacher/{slug}.ics` — ICS преподавателя
- `/assets/qrcode-generator.js` — локальная QR-библиотека (offline)

## Безопасность

Расписание — публичная информация (опубликовано на gtifem.ru/dekanat/).
Этот репозиторий **не содержит** персональных данных студентов, оценок, AI-результатов или работ.
