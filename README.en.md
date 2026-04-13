# Naymi AI

[Українська](README.md) | [Русский](README.ru.md) | [English](README.en.md)

**Personal AI recruiter for the Ukrainian job market**, built on Claude Code.

Automates the full job search cycle: portal scanning, offer evaluation, ATS-optimized CV generation, and application tracking. Supports three interface/document languages: **Ukrainian**, **Russian**, **English**.

---

## Features

| Feature | Details |
|---------|---------|
| **Offer evaluation** | A-F scoring: CV match, salary, culture signals, red flags |
| **CV generation** | ATS-optimized PDF tailored to each JD, in the JD's language |
| **Portal scanning** | Djinni, DOU, Work.ua, Robota.ua + custom keywords |
| **Application tracker** | Full status flow: Evaluated → Applied → Interview → Offer / Rejected |
| **Cover letter** | Auto-generated with CV, JD-specific |
| **LinkedIn outreach** | Finds the right contact + drafts the message |
| **Follow-up cadence** | Tracks when and how to follow up |
| **Rejection patterns** | Analysis across scoring, companies, roles |
| **Interview prep** | STAR+R stories, company-specific intel |

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/naymi-ai
cd naymi-ai
npm install
npx playwright install chromium
```

Open in [Claude Code](https://claude.ai/code) or [OpenCode](https://opencode.ai).  
Paste a job URL or JD text — the agent runs the full pipeline automatically.

---

## Language Configuration

In `config/profile.yml`:

```yaml
language:
  agent: "en"          # agent response language: uk | ru | en
  cv_default: "en"     # default CV language
  jd_output: "match_jd" # generate CV in JD's language
```

Technical terms (LLM, RAG, Tool Calling, MCP, HITL, LangGraph) are always in English regardless of document language.

---

## Scoring System

Each offer is scored **1–5** across 6 dimensions:

- **4.5+** → Strong match, apply immediately
- **4.0–4.4** → Good match, worth applying
- **3.5–3.9** → Decent but not ideal
- **< 3.5** → Recommend against applying

---

## License

MIT
