/**
 * 刮刮樂（Scratch-Off）— 介面與互動。
 * 每格上覆一層「刮層」（DOM，以 CSS radial-gradient 遮罩模擬刮除），
 * 刮開下方藏著 ○/✕。整卡刮完結算獎項。
 * 純娛樂，非真實博弈。
 */
import { generateCard, scratch, scratchedCount, isFullyScratched, settle } from "./game.js";
import { GuagualeAudio } from "./audio.js";

const audio = new GuagualeAudio();

const els = {
  board: document.getElementById("board"),
  status: document.getElementById("status"),
  statScratched: document.getElementById("stat-scratched"),
  statWon: document.getElementById("stat-won"),
  btnNew: document.getElementById("btn-new"),
  btnMusic: document.getElementById("btn-music"),
  best: document.getElementById("best-label"),
};

const BEST_KEY = "pg-guaguale-best";

let card = null;
let best = null;
let settled = false;

function newCard() {
  card = generateCard({ rows: 6, cols: 3, winRate: 0.25 });
  settled = false;
  render();
  setStatus("用手指刮開格子，刮到 3 個相同符號連在一起就是中獎！");
}

function setStatus(msg, tone = "") {
  els.status.textContent = msg;
  els.status.dataset.tone = tone;
}

function handleScratch(i) {
  if (settled) return;
  const { card: next, event } = scratch(card, i);
  if (event.kind === "invalid") return;
  card = next;
  audio.scratchOnce();
  if (event.won) audio.hit();
  else audio.miss();
  render();
  if (isFullyScratched(card)) doSettle();
}

function doSettle() {
  settled = true;
  const s = settle(card);
  if (s.prize === "大獎") {
    audio.win();
    setStatus("🎉 中了大獎！3 個相同符號連在一起！", "win");
  } else if (s.prize === "小獎") {
    audio.win();
    setStatus("中獎了！不過要 3 個連在一起才算大獎。", "win");
  } else {
    audio.lose();
    setStatus("銘謝惠顧，再來一張試試手氣！", "lose");
  }
  updateBest(s.won);
}

function updateBest(won) {
  if (best === null || won > best) {
    best = won;
    els.best.textContent = `${best} 個`;
    saveBest(won);
  }
}

/* ---------- 渲染 ---------- */
function render() {
  els.statScratched.textContent = `${scratchedCount(card)}/${card.cells.length}`;
  els.statWon.textContent = `${card.cells.filter((c) => c.scratched && c.won).length} 個`;
  els.board.innerHTML = "";
  els.board.style.setProperty("--cols", String(card.cols));
  card.cells.forEach((cell, i) => {
    const cellEl = document.createElement("div");
    cellEl.className = "cell";
    const inner = document.createElement("span");
    inner.className = "inner";
    inner.textContent = cell.symbol;
    if (cell.won) inner.classList.add("won");
    cellEl.appendChild(inner);
    if (!cell.scratched) {
      const cover = document.createElement("div");
      cover.className = "cover";
      cover.dataset.i = String(i);
      cover.addEventListener("click", () => handleScratch(i));
      cellEl.appendChild(cover);
    } else {
      cellEl.classList.add("open");
    }
    els.board.appendChild(cellEl);
  });
}

/* ---------- 事件 ---------- */
function bindEvents() {
  els.btnNew.addEventListener("click", () => {
    audio.unlock();
    newCard();
  });
  els.btnMusic.addEventListener("click", () => {
    const on = audio.enabled;
    audio.setEnabled(!on);
    els.btnMusic.setAttribute("aria-pressed", String(!on));
    els.btnMusic.textContent = on ? "聲音關" : "聲音開";
  });
}

/* ---------- KV ---------- */
async function loadBest() {
  try {
    const res = await fetch(`/api/kv/${BEST_KEY}`);
    if (res.ok) {
      const t = (await res.text()).trim();
      if (/^\d+$/.test(t)) {
        best = Number(t);
        els.best.textContent = `${best} 個`;
        return;
      }
    }
  } catch {
    /* 無 KV */
  }
  els.best.textContent = "—";
}

async function saveBest(v) {
  try {
    await fetch(`/api/kv/${BEST_KEY}`, { method: "PUT", body: String(v) });
  } catch {
    /* 無 KV */
  }
}

/* ---------- 啟動 ---------- */
async function init() {
  bindEvents();
  await loadBest();
  newCard();
}

init();