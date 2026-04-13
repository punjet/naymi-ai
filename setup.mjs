/**
 * Naymi AI — Setup Wizard
 * Runs a local web server to configure the project through a browser UI.
 * Usage: npm run setup
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 3737
const CONFIG_PATH = path.join(__dirname, 'config/profile.yml')
const PORTALS_PATH = path.join(__dirname, 'portals.yml')
const SETUP_DONE_PATH = path.join(__dirname, 'config/.setup-done')

function readYaml(p) {
  try { return yaml.load(fs.readFileSync(p, 'utf8')) || {} } catch { return {} }
}

function writeYaml(p, data) {
  fs.writeFileSync(p, yaml.dump(data, { indent: 2, lineWidth: 120 }), 'utf8')
}

function deepMerge(base, over) {
  const out = { ...base }
  for (const k of Object.keys(over || {})) {
    if (over[k] !== null && typeof over[k] === 'object' && !Array.isArray(over[k])) {
      out[k] = deepMerge(base[k] || {}, over[k])
    } else if (over[k] !== undefined && over[k] !== null && over[k] !== '') {
      out[k] = over[k]
    }
  }
  return out
}

// ─── HTML ────────────────────────────────────────────────────────────────────

const HTML = /* html */`<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Naymi AI — Налаштування</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #0C0B09;
  --surface:     #141210;
  --surface-2:   #1C1A17;
  --border:      #2A2720;
  --border-2:    #343028;
  --text:        #EDE8DF;
  --text-2:      #9A9288;
  --text-3:      #5C5650;
  --accent:      #C4852A;
  --accent-hi:   #E09B36;
  --accent-dim:  rgba(196,133,42,.13);
  --accent-line: rgba(196,133,42,.3);
  --green:       #4D9E72;
  --green-dim:   rgba(77,158,114,.13);
  --r:           10px;
}

html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }

.app { min-height: 100vh; display: grid; place-items: start center; padding: 48px 16px 64px; }

/* ── Wizard shell ── */
.wizard { width: 100%; max-width: 560px; }

.brand {
  display: flex; align-items: center; gap: 10px; margin-bottom: 40px;
}
.brand-mark {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--accent-dim); border: 1px solid var(--accent-line);
  display: grid; place-items: center;
}
.brand-mark svg { color: var(--accent-hi); }
.brand-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: .04em; color: var(--text); }
.brand-tag { font-size: 12px; color: var(--text-3); }

/* ── Progress ── */
.progress {
  display: flex; align-items: flex-start; gap: 0;
  margin-bottom: 36px; position: relative;
}
.progress::before {
  content: ''; position: absolute; top: 13px; left: 13px; right: 13px;
  height: 1px; background: var(--border-2); z-index: 0;
}
.p-step {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 7px; position: relative; z-index: 1;
}
.p-dot {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--surface-2); border: 1.5px solid var(--border-2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; font-weight: 700;
  color: var(--text-3); transition: all .2s ease;
}
.p-label { font-size: 11px; color: var(--text-3); letter-spacing: .03em; transition: color .2s; white-space: nowrap; }

.p-step.active .p-dot  { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-hi); }
.p-step.active .p-label { color: var(--text-2); }
.p-step.done  .p-dot  { border-color: var(--accent); background: var(--accent); color: var(--bg); }
.p-step.done  .p-label { color: var(--accent); }

/* ── Card ── */
.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; padding: 36px 36px 32px;
}

.step-title {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px;
  font-weight: 700; color: var(--text); line-height: 1.2; margin-bottom: 5px;
}
.step-desc { font-size: 14px; color: var(--text-2); margin-bottom: 28px; }

/* ── Fields ── */
.field { margin-bottom: 18px; }
.field:last-of-type { margin-bottom: 0; }

.field > label {
  display: block; font-size: 11px; font-weight: 500; letter-spacing: .07em;
  text-transform: uppercase; color: var(--text-3); margin-bottom: 7px;
}
.field > label em { text-transform: none; font-style: normal; font-weight: 400; letter-spacing: 0; color: var(--text-3); opacity: .7; }

input[type=text], input[type=email], input[type=tel], input[type=number], select, textarea {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border-2);
  border-radius: var(--r); padding: 10px 13px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text);
  outline: none; transition: border-color .18s; resize: none;
  -moz-appearance: textfield;
}
input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
input::placeholder, textarea::placeholder { color: var(--text-3); }
select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235C5650' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; -webkit-appearance: none; appearance: none; }

.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.row3-1 { display: grid; grid-template-columns: 1fr 1fr 1fr 80px; gap: 10px; align-items: end; }

.sublabel { font-size: 11px; color: var(--text-3); margin-bottom: 6px; }

/* ── Tag input ── */
.tag-wrap {
  min-height: 44px; background: var(--surface-2); border: 1px solid var(--border-2);
  border-radius: var(--r); padding: 6px 8px; display: flex; flex-wrap: wrap;
  gap: 5px; cursor: text; transition: border-color .18s; align-items: center;
}
.tag-wrap:focus-within { border-color: var(--accent); }
.tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--accent-dim); border: 1px solid var(--accent-line);
  color: var(--accent-hi); border-radius: 6px; padding: 2px 8px;
  font-size: 13px; font-weight: 500; white-space: nowrap;
}
.tag button { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 14px; line-height: 1; padding: 0; opacity: .6; transition: opacity .12s; }
.tag button:hover { opacity: 1; }
.tag-input {
  border: none !important; background: transparent !important; padding: 2px 4px !important;
  font-size: 13px !important; min-width: 100px; flex: 1;
}
.hint { font-size: 12px; color: var(--text-3); margin-top: 6px; }

/* ── Radio grid ── */
.radio-group { display: flex; gap: 8px; }
.r-btn { flex: 1; position: relative; }
.r-btn input { position: absolute; opacity: 0; width: 0; height: 0; }
.r-btn label {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 10px 8px; background: var(--surface-2); border: 1.5px solid var(--border-2);
  border-radius: var(--r); cursor: pointer; text-transform: none; letter-spacing: 0;
  font-size: 14px; font-weight: 500; color: var(--text-2); gap: 2px; text-align: center;
  transition: all .18s;
}
.r-btn label sub { font-size: 11px; color: var(--text-3); font-weight: 400; }
.r-btn input:checked + label { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-hi); }
.r-btn input:checked + label sub { color: var(--accent); }

/* ── Divider ── */
.divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

/* ── Navigation ── */
.nav { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }

.btn { padding: 10px 22px; border-radius: var(--r); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all .18s; }
.btn-ghost { background: transparent; border: 1px solid var(--border-2); color: var(--text-2); }
.btn-ghost:hover { border-color: var(--text-3); color: var(--text); }
.btn-primary { background: var(--accent); color: #0C0B09; font-weight: 600; }
.btn-primary:hover { background: var(--accent-hi); }
.btn-primary:active { transform: scale(.98); }

/* ── Steps ── */
.step { display: none; }
.step.active { display: block; animation: fadeUp .25s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── Done screen ── */
.done-icon {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--green-dim); border: 1.5px solid var(--green);
  display: grid; place-items: center; margin: 0 auto 20px;
}
.done-icon svg { color: var(--green); }
.cmd-block {
  background: var(--bg); border: 1px solid var(--border-2); border-radius: var(--r);
  padding: 12px 14px; font-family: 'SFMono-Regular', 'Consolas', monospace;
  font-size: 13px; color: var(--accent-hi); margin-top: 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.copy-btn {
  background: none; border: 1px solid var(--border-2); border-radius: 6px;
  color: var(--text-3); font-size: 11px; padding: 3px 8px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; flex-shrink: 0; transition: all .15s;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ── Saving overlay ── */
.overlay {
  position: fixed; inset: 0; background: rgba(12,11,9,.75);
  backdrop-filter: blur(6px); display: grid; place-items: center;
  opacity: 0; pointer-events: none; transition: opacity .2s;
}
.overlay.on { opacity: 1; pointer-events: all; }
.saving-msg { font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; font-weight: 600; color: var(--accent-hi); }
</style>
</head>
<body>
<div class="app">
<div class="wizard">

  <!-- Brand -->
  <div class="brand">
    <div class="brand-mark">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    </div>
    <div>
      <div class="brand-name">Naymi AI</div>
      <div class="brand-tag">Налаштування проєкту</div>
    </div>
  </div>

  <!-- Progress -->
  <div class="progress" id="prog">
    <div class="p-step active" data-i="0"><div class="p-dot">1</div><div class="p-label">Профіль</div></div>
    <div class="p-step"        data-i="1"><div class="p-dot">2</div><div class="p-label">Ролі</div></div>
    <div class="p-step"        data-i="2"><div class="p-dot">3</div><div class="p-label">Мова</div></div>
    <div class="p-step"        data-i="3"><div class="p-dot">4</div><div class="p-label">Портали</div></div>
  </div>

  <!-- Card -->
  <div class="card">

    <!-- ── Step 0: Profile ── -->
    <div class="step active" id="s0">
      <div class="step-title">Розкажи про себе</div>
      <div class="step-desc">Ці дані підставляються в кожне CV та cover letter.</div>

      <div class="field">
        <label>Повне ім'я</label>
        <input type="text" id="f-name" placeholder="Ім'я Прізвище">
      </div>
      <div class="row2">
        <div class="field">
          <label>Email</label>
          <input type="email" id="f-email" placeholder="you@example.com">
        </div>
        <div class="field">
          <label>Телефон</label>
          <input type="tel" id="f-phone" placeholder="+380 XX XXX XX XX">
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label>Місто</label>
          <input type="text" id="f-location" placeholder="Київ, Україна">
        </div>
        <div class="field">
          <label>LinkedIn <em>(опційно)</em></label>
          <input type="text" id="f-linkedin" placeholder="linkedin.com/in/username">
        </div>
      </div>
      <div class="field">
        <label>Заголовок — хто ти в одному рядку</label>
        <input type="text" id="f-headline" placeholder="AI Agent Developer — автоматизація процесів через LLM-агенти">
      </div>

      <div class="nav">
        <div></div>
        <button class="btn btn-primary" onclick="go(1)">Далі →</button>
      </div>
    </div>

    <!-- ── Step 1: Roles & Comp ── -->
    <div class="step" id="s1">
      <div class="step-title">Цілі та компенсація</div>
      <div class="step-desc">Агент оцінює вакансії та формує CV відносно цих ролей і зарплатних очікувань.</div>

      <div class="field">
        <label>Цільові ролі <em>— введи та натисни Enter</em></label>
        <div class="tag-wrap" onclick="document.getElementById('roles-in').focus()">
          <span id="roles-tags" style="display:contents"></span>
          <input class="tag-input" id="roles-in" placeholder="AI Agent Developer...">
        </div>
      </div>

      <hr class="divider">

      <div class="field">
        <label>Зарплатні очікування <em>(USD/місяць)</em></label>
        <div class="row3-1">
          <div>
            <div class="sublabel">Мінімум</div>
            <input type="number" id="f-sal-min" placeholder="1500">
          </div>
          <div>
            <div class="sublabel">Ціль</div>
            <input type="number" id="f-sal-target" placeholder="2500">
          </div>
          <div>
            <div class="sublabel">Максимум</div>
            <input type="number" id="f-sal-max" placeholder="4000">
          </div>
          <div>
            <div class="sublabel">Валюта</div>
            <select id="f-sal-cur">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UAH">UAH</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row2" style="margin-top:18px">
        <div class="field" style="margin:0">
          <label>Формат роботи</label>
          <select id="f-work-format">
            <option value="onsite">Офіс</option>
            <option value="hybrid">Гібрид</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div class="field" style="margin:0">
          <label>Місто</label>
          <input type="text" id="f-city" placeholder="Київ">
        </div>
      </div>

      <div class="nav">
        <button class="btn btn-ghost" onclick="go(0)">← Назад</button>
        <button class="btn btn-primary" onclick="go(2)">Далі →</button>
      </div>
    </div>

    <!-- ── Step 2: Language ── -->
    <div class="step" id="s2">
      <div class="step-title">Мова</div>
      <div class="step-desc">Налаштуй мову агента і логіку генерації CV.</div>

      <div class="field">
        <label>Мова агента — якою відповідає агент</label>
        <div class="radio-group">
          <div class="r-btn"><input type="radio" name="ag" id="ag-uk" value="uk" checked><label for="ag-uk">🇺🇦 Українська</label></div>
          <div class="r-btn"><input type="radio" name="ag" id="ag-ru" value="ru"><label for="ag-ru">🇷🇺 Русский</label></div>
          <div class="r-btn"><input type="radio" name="ag" id="ag-en" value="en"><label for="ag-en">🇬🇧 English</label></div>
        </div>
      </div>

      <div class="field">
        <label>Мова CV за замовчуванням</label>
        <div class="radio-group">
          <div class="r-btn"><input type="radio" name="cv" id="cv-uk" value="uk" checked><label for="cv-uk">🇺🇦 Українська</label></div>
          <div class="r-btn"><input type="radio" name="cv" id="cv-ru" value="ru"><label for="cv-ru">🇷🇺 Русский</label></div>
          <div class="r-btn"><input type="radio" name="cv" id="cv-en" value="en"><label for="cv-en">🇬🇧 English</label></div>
        </div>
      </div>

      <div class="field">
        <label>CV мовою вакансії?</label>
        <div class="radio-group">
          <div class="r-btn">
            <input type="radio" name="jdo" id="jdo-match" value="match_jd" checked>
            <label for="jdo-match">Так<sub>мовою JD</sub></label>
          </div>
          <div class="r-btn">
            <input type="radio" name="jdo" id="jdo-def" value="cv_default">
            <label for="jdo-def">Ні<sub>завжди за замовч.</sub></label>
          </div>
        </div>
      </div>

      <div class="nav">
        <button class="btn btn-ghost" onclick="go(1)">← Назад</button>
        <button class="btn btn-primary" onclick="go(3)">Далі →</button>
      </div>
    </div>

    <!-- ── Step 3: Portals ── -->
    <div class="step" id="s3">
      <div class="step-title">Ключові слова</div>
      <div class="step-desc">Сканер фільтрує вакансії по заголовку. Налаштуй під свої ролі.</div>

      <div class="field">
        <label>Шукати вакансії зі словами <em>— Enter або кома для додавання</em></label>
        <div class="tag-wrap" onclick="document.getElementById('pos-in').focus()">
          <span id="pos-tags" style="display:contents"></span>
          <input class="tag-input" id="pos-in" placeholder="AI, LLM, Agent...">
        </div>
        <div class="hint">Заголовок повинен містити хоча б одне з цих слів.</div>
      </div>

      <div class="field">
        <label>Виключити вакансії зі словами</label>
        <div class="tag-wrap" onclick="document.getElementById('neg-in').focus()">
          <span id="neg-tags" style="display:contents"></span>
          <input class="tag-input" id="neg-in" placeholder="Junior, React, PHP...">
        </div>
        <div class="hint">Вакансії з цими словами будуть проігноровані.</div>
      </div>

      <div class="nav">
        <button class="btn btn-ghost" onclick="go(2)">← Назад</button>
        <button class="btn btn-primary" onclick="save()">Зберегти ✓</button>
      </div>
    </div>

    <!-- ── Done ── -->
    <div class="step" id="s-done">
      <div style="text-align:center;padding:8px 0">
        <div class="done-icon">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="step-title" style="margin-bottom:8px">Готово!</div>
        <div class="step-desc" style="margin-bottom:0">Конфіг збережено. Відкрий проєкт в Claude Code або OpenCode — вставте URL вакансії і починайте.</div>
        <div class="cmd-block">
          <span>claude .</span>
          <button class="copy-btn" onclick="cp('claude .')">копіювати</button>
        </div>
        <div class="cmd-block">
          <span>opencode</span>
          <button class="copy-btn" onclick="cp('opencode')">копіювати</button>
        </div>
        <p style="margin-top:20px;font-size:13px;color:var(--text-3)">
          Потім вставте URL або текст вакансії — агент запустить повний пайплайн.
        </p>
      </div>
    </div>

  </div><!-- /card -->
</div><!-- /wizard -->
</div><!-- /app -->

<div class="overlay" id="overlay">
  <div class="saving-msg">Зберігаємо…</div>
</div>

<script>
// ── State ──────────────────────────────────────────────────────
let cfg = {}, portals = {}
let roleTags = [], posTags = [], negTags = []
let cur = 0

// ── Boot ──────────────────────────────────────────────────────
async function boot() {
  const [cr, pr] = await Promise.all([fetch('/api/config'), fetch('/api/portals')])
  cfg = await cr.json()
  portals = await pr.json()

  // Step 0
  v('f-name',     cfg.candidate?.full_name   || '')
  v('f-email',    cfg.candidate?.email       || '')
  v('f-phone',    cfg.candidate?.phone       || '')
  v('f-location', cfg.candidate?.location    || 'Київ, Україна')
  v('f-linkedin', cfg.candidate?.linkedin    || '')
  v('f-headline', cfg.narrative?.headline    || '')

  // Step 1
  roleTags = [...(cfg.target_roles?.primary || [])]
  renderTags('roles-tags', 'roles-in', roleTags)
  const sal = cfg.compensation || {}
  v('f-sal-min',    parseNum(sal.minimum)      || 1500)
  v('f-sal-target', parseNum(sal.target_range) || 2500)
  v('f-sal-max',    parseNum(sal.target_range, true) || 4000)
  v('f-sal-cur',    sal.currency || 'USD')
  v('f-work-format', cfg.location?.work_format || 'onsite')
  v('f-city',        cfg.location?.city        || 'Kyiv')

  // Step 2
  setRadio('ag',  cfg.language?.agent      || 'uk')
  setRadio('cv',  cfg.language?.cv_default || 'uk')
  setRadio('jdo', cfg.language?.jd_output  || 'match_jd')

  // Step 3
  posTags = [...(portals.title_filter?.positive || [])]
  negTags = [...(portals.title_filter?.negative || [])]
  renderTags('pos-tags', 'pos-in', posTags)
  renderTags('neg-tags', 'neg-in', negTags)
}

// ── Helpers ───────────────────────────────────────────────────
function v(id, val) {
  const el = document.getElementById(id)
  if (el) el.value = val
}
function setRadio(name, val) {
  const el = document.querySelector('input[name="' + name + '"][value="' + val + '"]')
  if (el) el.checked = true
}
function radio(name) {
  return document.querySelector('input[name="' + name + '"]:checked')?.value || ''
}
function parseNum(str, isMax) {
  if (!str) return null
  const nums = String(str).match(/\\d+/g)
  if (!nums) return null
  return isMax ? +nums[nums.length - 1] : +nums[0]
}

// ── Tag inputs ─────────────────────────────────────────────────
function renderTags(containerId, inputId, tags) {
  const container = document.getElementById(containerId)
  container.querySelectorAll?.('.tag')?.forEach(t => t.remove())
  // Remove existing tags from parent
  const parent = container.parentNode
  parent.querySelectorAll('.tag').forEach(t => t.remove())

  const input = document.getElementById(inputId)
  tags.forEach((tag, i) => {
    const el = document.createElement('span')
    el.className = 'tag'
    el.innerHTML = escHtml(tag) + '<button type="button" data-cid="' + containerId + '" data-iid="' + inputId + '" data-i="' + i + '">×</button>'
    parent.insertBefore(el, input)
  })
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
document.addEventListener('click', e => {
  if (e.target.matches('.tag button')) {
    const cid = e.target.dataset.cid, iid = e.target.dataset.iid, i = +e.target.dataset.i
    const arr = cid === 'roles-tags' ? roleTags : cid === 'pos-tags' ? posTags : negTags
    arr.splice(i, 1)
    renderTags(cid, iid, arr)
  }
})
function addTag(inputId, containerId, arr) {
  const input = document.getElementById(inputId)
  const raw = input.value.trim().replace(/,$/, '').trim()
  if (!raw) return
  raw.split(/[,\\n]+/).map(s => s.trim()).filter(Boolean).forEach(t => arr.push(t))
  input.value = ''
  renderTags(containerId, inputId, arr)
}
function setupTagInput(inputId, containerId, arr) {
  document.getElementById(inputId).addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputId, containerId, arr) }
    else if (e.key === 'Backspace' && !e.target.value && arr.length) { arr.pop(); renderTags(containerId, inputId, arr) }
  })
}

// ── Navigation ────────────────────────────────────────────────
function go(n) {
  document.getElementById('s' + cur).classList.remove('active')
  cur = n
  document.getElementById('s' + cur).classList.add('active')
  document.querySelectorAll('.p-step').forEach((el, i) => {
    el.classList.remove('active', 'done')
    if (i === n) el.classList.add('active')
    else if (i < n) { el.classList.add('done'); el.querySelector('.p-dot').textContent = '✓' }
    else el.querySelector('.p-dot').textContent = i + 1
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Save ──────────────────────────────────────────────────────
async function save() {
  document.getElementById('overlay').classList.add('on')

  const cur = g('f-sal-cur')
  const mn  = +g('f-sal-min')    || 1500
  const tg  = +g('f-sal-target') || 2500
  const mx  = +g('f-sal-max')    || 4000

  const newCfg = {
    ...cfg,
    candidate: {
      ...cfg.candidate,
      full_name: g('f-name'),
      email:     g('f-email'),
      phone:     g('f-phone'),
      location:  g('f-location'),
      linkedin:  g('f-linkedin') || undefined,
    },
    target_roles: {
      ...cfg.target_roles,
      primary: [...roleTags],
    },
    narrative: {
      ...cfg.narrative,
      headline: g('f-headline') || cfg.narrative?.headline || '',
    },
    compensation: {
      target_range: mn + '-' + mx + '/' + cur.toLowerCase() + '-month',
      currency:     cur,
      minimum:      mn + '/' + cur.toLowerCase() + '-month',
      location_flexibility: g('f-work-format') === 'onsite' ? 'Офіс у ' + g('f-city')
        : g('f-work-format') === 'hybrid' ? 'Гібрид, ' + g('f-city')
        : 'Remote',
    },
    location: {
      ...cfg.location,
      city:        g('f-city'),
      country:     'Ukraine',
      work_format: g('f-work-format'),
    },
    language: {
      ...cfg.language,
      agent:      radio('ag'),
      cv_default: radio('cv'),
      jd_output:  radio('jdo'),
      market:     'UA',
    },
  }

  // Clean undefined keys
  Object.keys(newCfg.candidate).forEach(k => newCfg.candidate[k] === undefined && delete newCfg.candidate[k])

  const newPortals = { ...portals }
  if (!newPortals.title_filter) newPortals.title_filter = {}
  newPortals.title_filter.positive = [...posTags]
  newPortals.title_filter.negative = [...negTags]

  try {
    await Promise.all([
      post('/api/config',  newCfg),
      post('/api/portals', newPortals),
    ])
    document.getElementById('overlay').classList.remove('on')
    document.getElementById('s3').classList.remove('active')
    document.getElementById('s-done').classList.add('active')
    document.querySelectorAll('.p-step').forEach(el => {
      el.classList.remove('active')
      el.classList.add('done')
      el.querySelector('.p-dot').textContent = '✓'
    })
  } catch(e) {
    document.getElementById('overlay').classList.remove('on')
    alert('Помилка збереження: ' + e.message)
  }
}

function g(id)     { return document.getElementById(id)?.value?.trim() || '' }
function post(url, body) { return fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() }) }
function cp(cmd)   { navigator.clipboard.writeText(cmd).catch(() => {}) }

// ── Init ─────────────────────────────────────────────────────
setupTagInput('roles-in', 'roles-tags', roleTags)
setupTagInput('pos-in',   'pos-tags',   posTags)
setupTagInput('neg-in',   'neg-tags',   negTags)
boot()
</script>
</body>
</html>`

// ─── Server ───────────────────────────────────────────────────────────────────

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

function body(req) {
  return new Promise((res, rej) => {
    let d = ''
    req.on('data', c => d += c)
    req.on('end', () => { try { res(JSON.parse(d)) } catch(e) { rej(e) } })
    req.on('error', rej)
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const p = url.pathname

  if (req.method === 'GET'  && p === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(HTML)
  }

  if (req.method === 'GET'  && p === '/api/config') {
    res.writeHead(200, CORS)
    return res.end(JSON.stringify(readYaml(CONFIG_PATH)))
  }

  if (req.method === 'POST' && p === '/api/config') {
    try {
      const data = await body(req)
      writeYaml(CONFIG_PATH, data)
      // Mark setup as complete
      fs.writeFileSync(SETUP_DONE_PATH, new Date().toISOString(), 'utf8')
      res.writeHead(200, CORS); res.end(JSON.stringify({ ok: true }))
    } catch(e) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: e.message })) }
    return
  }

  if (req.method === 'GET'  && p === '/api/portals') {
    res.writeHead(200, CORS)
    return res.end(JSON.stringify(readYaml(PORTALS_PATH)))
  }

  if (req.method === 'POST' && p === '/api/portals') {
    try {
      const data = await body(req)
      writeYaml(PORTALS_PATH, data)
      res.writeHead(200, CORS); res.end(JSON.stringify({ ok: true }))
    } catch(e) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: e.message })) }
    return
  }

  res.writeHead(404); res.end()
})

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log('\n  Naymi AI — Setup Wizard')
  console.log(`  ${url}`)
  console.log('\n  Ctrl+C to stop\n')
  const open = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`
  exec(open)
})
