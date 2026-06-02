// ==UserScript==
// @name         📅 Расписание ФЭМ — кнопка «Добавить в календарь»
// @namespace    https://vnuchenic777-bot.github.io/gtifem-schedule/
// @version      2.0.0
// @description  Встраивает кнопку «Добавить в календарь» прямо в страницы расписания gtifem.ru — рядом с именем преподавателя/группы. Один клик — подписка в Apple/Google Calendar с автообновлением.
// @author       ФЭМ СПбГТИ
// @match        https://gtifem.ru/*
// @match        https://www.gtifem.ru/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22%231e7e1e%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2270%25%22%20text-anchor%3D%22middle%22%20font-size%3D%2222%22%20fill%3D%22%23fff%22%3E%F0%9F%93%85%3C%2Ftext%3E%3C%2Fsvg%3E
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/vnuchenic777-bot/gtifem-schedule
// @downloadURL  https://vnuchenic777-bot.github.io/gtifem-schedule/install/gtifem-schedule-button.user.js
// @updateURL    https://vnuchenic777-bot.github.io/gtifem-schedule/install/gtifem-schedule-button.user.js
// ==/UserScript==

(function () {
  "use strict";

  var API_BASE = "https://vnuchenic777-bot.github.io/gtifem-schedule/";
  var pathname = location.pathname;

  // Какие страницы интересуют — определяем по URL
  var IS_TEACHER_PAGE = /\/dekanat\/raspisanie-prepodavateley\/[^/]+\/?$/i.test(pathname);
  var IS_TEACHER_LIST = /\/dekanat\/raspisanie-prepodavateley\/?$/i.test(pathname);
  var IS_GROUP_PAGE   = /\/dekanat\/raspisanie\/?/i.test(pathname);
  var IS_RELEVANT = IS_TEACHER_PAGE || IS_TEACHER_LIST || IS_GROUP_PAGE || window.GSCHEDFEM_FORCE;

  if (!IS_RELEVANT) return;

  // === Стилизация — нативная кнопка под Bootstrap сайта ФЭМ ===
  var css = `
.gschedfem-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: #1e7e1e; color: #fff !important;
  padding: 8px 14px; border-radius: 4px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  text-decoration: none !important; border: 0; cursor: pointer;
  transition: background .15s, transform .05s;
  margin: 6px 4px; line-height: 1.3;
  vertical-align: middle;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(30,126,30,.2);
}
.gschedfem-btn:hover { background: #166916; color: #fff !important; transform: translateY(-1px); box-shadow: 0 3px 6px rgba(30,126,30,.3); }
.gschedfem-btn:active { transform: translateY(0); }
.gschedfem-btn.gschedfem-sm { padding: 4px 10px; font-size: 12px; margin: 2px; box-shadow: 0 1px 2px rgba(30,126,30,.15); }
.gschedfem-btn .gschedfem-icon { font-size: 14px; }

/* Плавающая кнопка как fallback / для удобства */
.gschedfem-float-btn {
  position: fixed; bottom: 20px; right: 20px; z-index: 999999;
  background: #1e7e1e; color: #fff !important; border-radius: 50px;
  padding: 12px 18px; font-size: 14px; font-weight: 700;
  box-shadow: 0 6px 18px rgba(30,126,30,.45);
  border: 0; cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  text-decoration: none !important;
  transition: transform .15s, box-shadow .15s;
}
.gschedfem-float-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(30,126,30,.55); }
.gschedfem-float-btn:active { transform: translateY(0); }

/* Модальное окно (для float-btn) */
.gschedfem-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 1000000;
  display: none; align-items: flex-end; justify-content: center;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.gschedfem-overlay.gschedfem-open { display: flex; }
.gschedfem-modal {
  background: #fff; border-radius: 12px 12px 0 0; width: 100%; max-width: 560px;
  max-height: 88vh; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0,0,0,.3);
  animation: gschedfem-slideUp .25s ease;
}
@keyframes gschedfem-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.gschedfem-modal-head {
  background: linear-gradient(180deg, #2f4f7a 0%, #1f3f6a 100%); color: #fff;
  padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;
}
.gschedfem-modal-head h3 { margin: 0; font-size: 17px; font-weight: 700; color: #fff; }
.gschedfem-modal-close {
  background: rgba(255,255,255,.15); color: #fff; border: 0;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 18px; line-height: 1;
}
.gschedfem-modal-close:hover { background: rgba(255,255,255,.28); }
.gschedfem-modal-body { padding: 16px 18px; overflow-y: auto; }
.gschedfem-modal-search {
  width: 100%; padding: 11px 13px; border: 1px solid #c1d3e3; border-radius: 6px;
  font-size: 14px; margin-bottom: 12px; -webkit-appearance: none;
  font-family: inherit; box-sizing: border-box;
}
.gschedfem-modal-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.gschedfem-modal-tab {
  flex: 1; background: #eef2f7; color: #2f4f7a; border: 0; padding: 8px 10px;
  border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: 600;
  font-family: inherit;
}
.gschedfem-modal-tab.gschedfem-active { background: #2f4f7a; color: #fff; }
.gschedfem-modal-list { display: flex; flex-direction: column; gap: 8px; }
.gschedfem-modal-item {
  background: #f9fafc; border: 1px solid #e0e6ec; border-radius: 6px;
  padding: 10px 12px; display: flex; align-items: center; gap: 10px;
}
.gschedfem-modal-item .gschedfem-info { flex: 1; min-width: 0; }
.gschedfem-modal-item .gschedfem-name { font-weight: 600; color: #1f3f6a; font-size: 14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gschedfem-modal-item .gschedfem-meta { color: #888; font-size: 12px; margin-top: 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gschedfem-empty { color: #888; text-align: center; padding: 20px; font-size: 13px; }
.gschedfem-tip {
  background: #fffbe6; border: 1px solid #f0c850; padding: 10px 12px;
  border-radius: 6px; font-size: 12px; color: #6a5300; margin-bottom: 12px;
}
@media (max-width: 600px) {
  .gschedfem-float-btn { padding: 10px 14px; font-size: 13px; }
}
`;
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // === Универсальный конструктор кнопки «Добавить в календарь» ===
  function makeButton(slug, kind, opts) {
    opts = opts || {};
    var icsUrl = API_BASE + "api/schedule/" + kind + "/" + slug + ".ics";
    var a = document.createElement("a");
    a.href = icsUrl;
    a.className = "gschedfem-btn" + (opts.small ? " gschedfem-sm" : "");
    a.setAttribute("title", "Подписаться на расписание в Apple/Google Calendar");
    a.innerHTML = '<span class="gschedfem-icon">📅</span>' + (opts.text || "Добавить в календарь");
    return a;
  }

  // === Загрузка маппинга gtifem-slug ↔ наш-slug ===
  var mappingPromise = fetch(API_BASE + "api/schedule/mapping.json")
    .then(function (r) { return r.json(); })
    .catch(function () { return { gtifem_to_ours: {} }; });

  // === ИНЖЕКЦИЯ КНОПОК ===

  // === Тип 1: страница ОДНОГО преподавателя ===
  function injectOnTeacherPage() {
    var match = pathname.match(/\/dekanat\/raspisanie-prepodavateley\/([^/]+)\/?$/i);
    if (!match) return;
    var gtifemSlug = match[1];

    mappingPromise.then(function (mapping) {
      var ourSlug = mapping.gtifem_to_ours && mapping.gtifem_to_ours[gtifemSlug];
      if (!ourSlug) {
        console.log("[ФЭМ Расписание] нет ICS для", gtifemSlug);
        return;
      }

      // Куда вставлять — рядом с h1/h2 на странице
      var heading = document.querySelector("#raspisanie h1") ||
                   document.querySelector("h1") ||
                   document.querySelector(".titleh1") ||
                   document.querySelector(".title h2") ||
                   document.querySelector("h2");
      if (!heading) return;

      // Вставляем после заголовка
      var wrap = document.createElement("div");
      wrap.style.cssText = "margin: 8px 0 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;";
      wrap.appendChild(makeButton(ourSlug, "teacher", { text: "📅 Добавить в календарь" }));

      var hint = document.createElement("span");
      hint.style.cssText = "font-size: 12px; color: #666;";
      hint.textContent = "→ откроется подписка в Apple/Google Calendar, обновляется автоматически";
      wrap.appendChild(hint);

      heading.parentNode.insertBefore(wrap, heading.nextSibling);
    });
  }

  // === Тип 2: страница СПИСКА преподавателей — кнопки возле каждой ссылки ===
  function injectOnTeacherList() {
    mappingPromise.then(function (mapping) {
      var seen = new Set();
      var links = document.querySelectorAll('a[href*="/dekanat/raspisanie-prepodavateley/"]');
      links.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var m = href.match(/\/dekanat\/raspisanie-prepodavateley\/([a-z0-9-]+)\/?$/i);
        if (!m) return;
        var gtifemSlug = m[1];
        if (seen.has(gtifemSlug)) return; // одна кнопка на одного преподавателя
        seen.add(gtifemSlug);
        var ourSlug = mapping.gtifem_to_ours && mapping.gtifem_to_ours[gtifemSlug];
        if (!ourSlug) return;

        // Найдём ячейку или контейнер этой ссылки и вставим кнопку
        var cell = link.closest("td") || link.closest("li") || link.parentNode;
        if (!cell) return;
        if (cell.querySelector(".gschedfem-btn")) return; // уже вставили
        var btn = makeButton(ourSlug, "teacher", { small: true, text: "📅 В календарь" });
        cell.appendChild(btn);
      });
    });
  }

  // === Тип 3: страница группового расписания — кнопка возле названия/фильтра группы ===
  function injectOnGroupPage() {
    // Группа определяется по data-group в любой ячейке расписания
    var groupAttr = document.querySelector('[data-group]');
    if (!groupAttr) return;
    var groupRaw = groupAttr.getAttribute("data-group");
    // Может быть "6411,6412" — берём первую
    var group = (groupRaw || "").split(",")[0].trim();
    if (!/^[0-9]+$/.test(group)) return;

    // Куда вставить — наверху блока расписания
    var target = document.querySelector("#raspisanie") || document.querySelector(".main");
    if (!target) return;
    if (target.querySelector(".gschedfem-btn")) return;

    var wrap = document.createElement("div");
    wrap.style.cssText = "margin: 12px 0; padding: 12px; background: #f0fbf0; border: 1px solid #b8d8b8; border-radius: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px;";
    var label = document.createElement("strong");
    label.style.cssText = "color: #1f6024; font-size: 14px;";
    label.textContent = "Группа " + group + ":";
    wrap.appendChild(label);
    wrap.appendChild(makeButton(group, "group", { text: "📅 Добавить расписание в календарь" }));
    var hint = document.createElement("span");
    hint.style.cssText = "font-size: 12px; color: #4a6a4c;";
    hint.textContent = "автообновление каждые 6 часов";
    wrap.appendChild(hint);

    target.insertBefore(wrap, target.firstChild);
  }

  // === Плавающая кнопка + модальное окно (fallback на всех страницах) ===
  function injectFloatingButton() {
    var btn = document.createElement("a");
    btn.className = "gschedfem-float-btn";
    btn.href = "#";
    btn.innerHTML = '<span>📅</span><span>Моё расписание</span>';
    btn.setAttribute("aria-label", "Открыть подписку на расписание");
    document.body.appendChild(btn);

    var overlay = document.createElement("div");
    overlay.className = "gschedfem-overlay";
    overlay.innerHTML = ''
      + '<div class="gschedfem-modal">'
      + '  <div class="gschedfem-modal-head">'
      + '    <h3>📅 Подписка в Apple/Google Calendar</h3>'
      + '    <button class="gschedfem-modal-close" aria-label="Закрыть">×</button>'
      + '  </div>'
      + '  <div class="gschedfem-modal-body">'
      + '    <div class="gschedfem-tip"><b>Нажмите «Открыть»</b> на нужном преподавателе/группе → Safari предложит «Открыть в Календаре» → «Подписаться». Обновляется ~раз в 6 часов.</div>'
      + '    <input type="text" class="gschedfem-modal-search" placeholder="🔍 Поиск фамилии или номера группы…" autocomplete="off">'
      + '    <div class="gschedfem-modal-tabs">'
      + '      <button class="gschedfem-modal-tab gschedfem-active" data-tab="teachers">Преподаватели</button>'
      + '      <button class="gschedfem-modal-tab" data-tab="groups">Группы</button>'
      + '    </div>'
      + '    <div class="gschedfem-modal-list"><div class="gschedfem-empty">Загружаю список…</div></div>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(overlay);

    var GROUP_TITLES = {
      "6211": "Эк · 4 курс", "6212": "Эк · 4 курс",
      "6311": "Эк · 3 курс", "6312": "Эк · 3 курс",
      "6411": "Эк · 2 курс", "6412": "Эк · 2 курс",
      "6461": "Бакалавриат",
      "6491": "СПО · 2 курс", "6591": "СПО · 1 курс",
      "6511": "Эк · 1 курс", "6512": "Эк · 1 курс"
    };

    var teachersCache = [], groupsCache = [], currentTab = "teachers";
    var search = overlay.querySelector(".gschedfem-modal-search");
    var listEl = overlay.querySelector(".gschedfem-modal-list");
    var closeBtn = overlay.querySelector(".gschedfem-modal-close");
    var tabs = overlay.querySelectorAll(".gschedfem-modal-tab");

    function open() {
      overlay.classList.add("gschedfem-open");
      setTimeout(function () { search.focus(); }, 100);
      if (!teachersCache.length) loadData(); else render();
    }
    function close() { overlay.classList.remove("gschedfem-open"); }

    function loadData() {
      Promise.all([
        fetch(API_BASE + "api/schedule/groups.json").then(function (r) { return r.json(); }),
        fetch(API_BASE + "api/schedule/teachers.json").then(function (r) { return r.json(); })
      ]).then(function (results) {
        groupsCache = (results[0] && results[0].groups) || [];
        teachersCache = (results[1] && results[1].teachers) || [];
        render();
      }).catch(function (err) {
        listEl.innerHTML = '<div class="gschedfem-empty" style="color:#c00;">Не удалось загрузить: ' + (err && err.message || err) + '</div>';
      });
    }

    function render() {
      var q = search.value.trim().toLowerCase();
      var src;
      if (currentTab === "teachers") {
        src = teachersCache.slice().sort(function (a, b) { return (b.lessons || 0) - (a.lessons || 0); });
      } else {
        src = groupsCache.map(function (g) { return { slug: g, name: "Группа " + g, lessons: 0, groups: [GROUP_TITLES[g] || ""] }; });
      }
      if (q) src = src.filter(function (it) { return ((it.name || "") + " " + (it.slug || "")).toLowerCase().indexOf(q) !== -1; });
      if (!src.length) { listEl.innerHTML = '<div class="gschedfem-empty">Ничего не найдено</div>'; return; }
      listEl.innerHTML = src.slice(0, 80).map(function (it) {
        var icsUrl = API_BASE + "api/schedule/" + (currentTab === "teachers" ? "teacher" : "group") + "/" + it.slug + ".ics";
        var meta = currentTab === "teachers"
          ? (it.lessons || 0) + " пар · " + (it.groups || []).slice(0, 3).join(", ")
          : (it.groups[0] || "");
        var safeName = (it.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var safeMeta = (meta || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return '<div class="gschedfem-modal-item">'
          + '<div class="gschedfem-info">'
          + '<div class="gschedfem-name">' + safeName + '</div>'
          + '<div class="gschedfem-meta">' + safeMeta + '</div>'
          + '</div>'
          + '<a class="gschedfem-btn gschedfem-sm" href="' + icsUrl + '">📅 Открыть</a>'
          + '</div>';
      }).join("");
    }

    btn.addEventListener("click", function (e) { e.preventDefault(); open(); });
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("gschedfem-open")) close();
    });
    search.addEventListener("input", render);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("gschedfem-active"); });
        t.classList.add("gschedfem-active");
        currentTab = t.getAttribute("data-tab");
        render();
      });
    });
  }

  // === Запуск ===
  if (IS_TEACHER_PAGE) {
    injectOnTeacherPage();
    console.log("[ФЭМ Расписание] страница преподавателя");
  }
  if (IS_TEACHER_LIST) {
    injectOnTeacherList();
    console.log("[ФЭМ Расписание] список преподавателей");
  }
  if (IS_GROUP_PAGE) {
    injectOnGroupPage();
    console.log("[ФЭМ Расписание] страница группы");
  }
  injectFloatingButton();

  console.log("[ФЭМ Расписание] v2.0 — кнопка готова на:", pathname);
})();
