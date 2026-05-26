# ZEN_OS — Next-Level Activity Command Center

```
╔══════════════════════════════════════════════════════════╗
║  Z E N _ O S   •   F U T U R E - F I R S T   P R O D U C T I V I T Y  ║
╚══════════════════════════════════════════════════════════╝
```

Welcome to the futuristic task universe built on `Next.js`, `React`, and `Tailwind CSS`.
This project is designed as a sleek productivity console with a dark-mode-first aesthetic, smart micro-interactions, and a refined dashboard experience.

---

## 🚀 What makes this project next-level

- **Multimodal command center** with 6 major zones:
  - `Dashboard` for fast insights
  - `Kanban` board for flow-based planning
  - `Calendar` for schedule visualization
  - `Analytics` for performance and streak tracking
  - `Vault` for saving links and resources
  - `Dante AI` for chat-style task intelligence

- **Pixel-perfect UI details**:
  - animated progress bars
  - gradient accents
  - hover-responsive cards
  - modal-driven task creation

- **Keyboard-powered workflow**:
  - `⌘K` opens the Add Task modal instantly

- **Persistent state** via browser local storage:
  - tasks, categories, vault links, theme, and AI history stay between sessions

---

## ✨ Visual navigation map

```text
╭─────────────────────────────────────────╮
│ ZEN_OS Application Shell                │
│                                         │
│  [Sidebar]   [Main Content Area]        │
│  ─────────   ─────────────────────────   │
│  • Dashboard  ──────────────────────    │
│  • Kanban     │  view panes & widgets  │
│  • Calendar   │  tasks, stats, chat    │
│  • Analytics  │  modals, filters, cards│
│  • Vault      │                       │
│  • Dante AI   └────────────────────────┘
╰─────────────────────────────────────────╯
```

---

## 🧠 Core features

### Dashboard
- Aggregate task counts
- Completion progress bars
- Today-focused task summary
- Category filtering with one-click reset

### Kanban
- 3-column status board
- clean, interactive task cards
- instant status at a glance

### Calendar
- month navigation controls
- date cell badges for scheduled tasks
- today highlight for quick context

### Analytics
- weekly completion sparkline
- category distribution bars
- status breakdown
- completion streak tracker

### Vault
- secure place to store links
- custom notes per item
- quick open to saved references

### Dante AI
- built as an in-app assistant chat
- instant task summary suggestions
- placeholder for API-powered intelligence

---

## 🛠️ Tech stack

- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `ESLint`

---

## ▶️ Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and start building your ZEN command flow.

---

## 💡 Design philosophy

This repo is all about:
- ambient productivity visuals
- lightweight state persistence
- rapid task creation and editing
- a strong focus on animation, clarity, and intuitive navigation

Whether you want a productivity hub, task studio, or AI-enhanced planner, `ZEN_OS` is crafted to feel modern, deliberate, and refined.

---

## 📁 Project files worth exploring

- `app/page.tsx` — app shell and view router
- `components/Sidebar.tsx` — navigation and reminders
- `components/Topbar.tsx` — theme toggle + task launcher
- `components/Modals.tsx` — add/edit forms
- `components/ui/TaskCard.tsx` — task presentation logic
- `context/ZenosContext.tsx` — persistent client state
- `components/views/*` — dashboard, kanban, calendar, analytics, vault, Dante AI

---

## 🎯 Next-level upgrade ideas

- connect `Dante AI` to a live LLM API
- drag-and-drop Kanban task movement
- file attachment support in `Vault`
- cross-device sync
- automated task reminders and notifications
