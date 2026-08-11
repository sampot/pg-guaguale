/**
 * 刮刮樂（Scratch-Off）— 純邏輯：生成刮卡、刮開判定、獎項結算。
 * 純函式設計，方便單元測試（不碰 DOM）。
 *
 * 玩法：一張卡有格數（默認 6×3=18）。每格底下藏一個「中獎開關」：
 *  每格獨立隨機開/關（開 = 中獎符號 ○，關 = 沒中 ✕）。
 *  同一行（或全卡）刮開看到 3 個相同符號即中該獎 → 結算時視為「中小獎」。
 *  純娛樂，明確標示非真實博弈。
 */

/** Fisher–Yates 洗牌，回傳新陣列。 */
export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 生成一張刮卡。
 * @param {object} cfg
 *   rows: 列數（默認 6）
 *   cols: 列格數（默認 3）
 *   winRate: 每格中獎機率（0..1，默認 0.22）
 *   symbols: 獎項符號池（預設 ["○","✕"]）
 *   seed: 可選種子（LGC 亂數）以利測試
 * 回傳 { rows, cols, cells: [{symbol, won}], prizes: {symbol: count} }
 */
export function generateCard({ rows = 6, cols = 3, winRate = 0.22, symbols = ["○", "✕"], rand = Math.random } = {}) {
  const total = rows * cols;
  if (total < 1) throw new Error("card must have at least one cell");
  if (winRate < 0 || winRate > 1) throw new Error("winRate must be in [0,1]");
  const cells = [];
  for (let i = 0; i < total; i++) {
    const won = rand() < winRate;
    // 開 = 中獎符號，關 = 沒中
    const symbol = won ? symbols[0] : symbols[1];
    cells.push({ symbol, won, scratched: false });
  }
  return { rows, cols, cells };
}

/** 刮開一格。回傳 { card, event }；event.kind：'ok'｜'invalid'(reason)｜'win'（刮到中獎格）。 */
export function scratch(card, i) {
  if (i < 0 || i >= card.cells.length) {
    return { card, event: { kind: "invalid", reason: "out-of-range" } };
  }
  const cell = card.cells[i];
  if (cell.scratched) {
    return { card, event: { kind: "invalid", reason: "already-scratched" } };
  }
  const next = {
    ...cell,
    scratched: true,
  };
  const newCells = card.cells.slice();
  newCells[i] = next;
  return {
    card: { ...card, cells: newCells },
    event: { kind: "win", won: next.won, symbol: next.symbol },
  };
}

/** 已刮開的格數。 */
export function scratchedCount(card) {
  return card.cells.filter((c) => c.scratched).length;
}

/** 中獎判定：出現連續 3 個以上的「中獎格」（won）。 */
export function hasThreeSame(card) {
  let streak = 0;
  for (const c of card.cells) {
    if (c.won) streak++;
    else streak = 0;
    if (streak >= 3) return true;
  }
  return false;
}

/** 是否整卡刮完。 */
export function isFullyScratched(card) {
  return card.cells.every((c) => c.scratched);
}

/** 結算：整卡刮完後，統計中獎格數與是否達成「3 連開」。 */
export function settle(card) {
  if (!isFullyScratched(card)) return null;
  const won = card.cells.filter((c) => c.won).length;
  const three = hasThreeSame(card);
  return {
    won,
    three,
    // 純娛樂：中獎格數即「刮中數」；3 連開視為大獎
    prize: three ? "大獎" : won > 0 ? "小獎" : "銘謝惠顧",
  };
}

/**
 * 獎池（可選）：回傳依 symbol 統計的中獎格數。
 * 回傳 { [symbol]: count }
 */
export function prizeCounts(card) {
  const counts = {};
  for (const c of card.cells) {
    if (!c.won) continue;
    counts[c.symbol] = (counts[c.symbol] ?? 0) + 1;
  }
  return counts;
}