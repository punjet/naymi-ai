# Naymi AI

[Українська](README.md) | [Русский](README.ru.md) | [English](README.en.md)

**Персональний AI-рекрутер для українського ринку праці**, побудований на Claude Code.

Автоматизує весь цикл пошуку роботи: від сканування порталів до генерації PDF-резюме та відстеження заявок. Підтримує три мови інтерфейсу та документів: **українська**, **російська**, **англійська**.

---

## Що вміє

| Функція | Деталі |
|---------|--------|
| **Оцінка вакансій** | Система A-F скорингу: збіг з CV, зарплата, культура, red flags |
| **Генерація CV** | ATS-оптимізоване PDF під конкретну вакансію, мовою JD |
| **Сканування порталів** | Djinni, DOU, Work.ua, Robota.ua + кастомні ключові слова |
| **Трекер заявок** | Статуси від Evaluated до Offer/Rejected |
| **Cover Letter** | Генерується разом з CV, прив'язана до JD |
| **LinkedIn аутрич** | Знаходить контакт у компанії + чернетка повідомлення |
| **Follow-up кадан** | Нагадування коли і як написати після відправки |
| **Аналіз відмов** | Паттерни по scoring, компаніям, ролям |
| **Prep до співбесіди** | STAR+R сторі, intel по компанії |

---

## Швидкий старт

```bash
# 1. Клонувати
git clone https://github.com/YOUR_USERNAME/naymi-ai
cd naymi-ai

# 2. Встановити залежності
npm install
npx playwright install chromium

# 3. Відкрити в Claude Code або OpenCode
# Вставити вакансію або URL — агент запустить повний пайплайн
```

**Потрібно:** [Claude Code](https://claude.ai/code) або [OpenCode](https://opencode.ai).

---

## Налаштування

### 1. Твоє CV

Створи `cv.md` у корені — або вставте CV прямо в чат, агент конвертує сам.

### 2. Профіль

Скопіюй `config/profile.example.yml` → `config/profile.yml` і заповни:

```yaml
candidate:
  name: "Ім'я Прізвище"
  email: "email@example.com"
  phone: "+380XXXXXXXXX"
  location: "Київ, Україна"

targets:
  roles:
    - "AI Agent Developer"
    - "AI Solutions Specialist"
  salary:
    min: 1500
    target: 2500
    max: 4000
    currency: "USD"

language:
  agent: "uk"          # uk | ru | en
  cv_default: "uk"     # мова CV за замовчуванням
  jd_output: "match_jd" # CV мовою JD, або "cv_default"
```

### 3. Портали

`portals.yml` — вже налаштований під Djinni, DOU, Work.ua, Robota.ua.  
Відкрий і додай свої ключові слова якщо потрібно.

---

## Використання

### Оцінити вакансію (авто-пайплайн)

Просто вставте URL або текст JD в чат:
```
https://djinni.co/jobs/XXXXXX-ai-engineer/
```
Агент автоматично: оцінить → створить звіт → згенерує CV → додасть до трекера.

### Сканування нових вакансій

```
/ai-recruiter scan
```

### Обробка черги

Додай URL у `data/pipeline.md` (по одному на рядок), потім:
```
/ai-recruiter pipeline
```

### Статус заявок

```
/ai-recruiter tracker
```

### Всі команди

```
/ai-recruiter
```

---

## Структура проєкту

```
naymi-ai/
├── cv.md                    # Твоє CV (канонічне джерело)
├── config/
│   └── profile.yml          # Твій профіль та налаштування
├── modes/
│   ├── _shared.md           # Системна логіка (не редагувати)
│   ├── _profile.md          # Твої архетипи та скрипти (тут персоналізація)
│   ├── oferta.md            # Режим оцінки вакансії
│   ├── pdf.md               # Режим генерації CV
│   ├── scan.md              # Режим сканування
│   └── ...                  # Інші режими
├── portals.yml              # Портали та ключові слова
├── templates/
│   └── cv-template.html     # HTML-шаблон CV
├── data/
│   ├── applications.md      # Трекер заявок
│   ├── pipeline.md          # Черга URL
│   └── scan-history.tsv     # Дедуп сканера
├── output/                  # Згенеровані PDF (gitignored)
├── reports/                 # Звіти оцінки (gitignored)
└── generate-pdf.mjs         # Playwright: HTML → PDF
```

---

## Мовна логіка

| Налаштування | Поведінка |
|-------------|-----------|
| `agent: uk` | Агент відповідає українською |
| `agent: ru` | Агент відповідає російською |
| `agent: en` | Agent responds in English |
| `jd_output: match_jd` | CV мовою вакансії (укр/рос/англ) |
| `jd_output: cv_default` | CV завжди мовою `cv_default` |

Технічні терміни (LLM, RAG, Tool Calling, MCP, HITL, LangGraph) — завжди англійською.

---

## Система оцінки

Кожна вакансія отримує оцінку **1–5** за 6 блоками:

| Блок | Що оцінюється |
|------|--------------|
| A | Збіг з CV та навичками |
| B | Відповідність цільовим ролям (North Star) |
| C | Зарплата vs ринок |
| D | Культура, стабільність, команда |
| E | Red flags та блокери |
| F | Загальна оцінка |
| G | Legitimacy (вакансія реальна?) — окремо, не впливає на score |

**Інтерпретація:**
- **4.5+** → Сильний збіг, подаватись негайно
- **4.0–4.4** → Добре, варто подаватись
- **3.5–3.9** → Непогано, але не ідеал
- **< 3.5** → Не рекомендується

---

## Технологічний стек

- **Runtime:** Node.js (ES modules)
- **PDF:** Playwright (Chromium)
- **Config:** YAML
- **Дані:** Markdown + TSV
- **AI:** Claude Code / OpenCode

---

## Ліцензія

MIT — форкай, адаптуй, використовуй.
