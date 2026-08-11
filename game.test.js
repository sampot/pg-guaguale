import { describe, it, expect } from "vitest";
import {
  generateCard,
  scratch,
  scratchedCount,
  hasThreeSame,
  isFullyScratched,
  settle,
  prizeCounts,
} from "./game.js";

// 決定性 LCG 供測試
function lcg(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe("generateCard", () => {
  it("creates rows×cols cells, all unscratched", () => {
    const card = generateCard({ rows: 6, cols: 3 });
    expect(card.cells).toHaveLength(18);
    expect(card.cells.every((c) => !c.scratched)).toBe(true);
  });

  it("defaults to 6×3", () => {
    const card = generateCard();
    expect(card.rows).toBe(6);
    expect(card.cols).toBe(3);
    expect(card.cells).toHaveLength(18);
  });

  it("rejects invalid winRate", () => {
    expect(() => generateCard({ winRate: 1.5 })).toThrow();
    expect(() => generateCard({ winRate: -0.1 })).toThrow();
  });

  it("is deterministic under a seeded LCG", () => {
    const a = generateCard({ rows: 4, cols: 3, rand: lcg(7) });
    const b = generateCard({ rows: 4, cols: 3, rand: lcg(7) });
    expect(a.cells.map((c) => c.symbol)).toEqual(b.cells.map((c) => c.symbol));
  });
});

describe("scratch", () => {
  it("opens a cell and marks won per its symbol", () => {
    const card = generateCard({ rows: 2, cols: 2, winRate: 0, rand: () => 0.5 });
    const r = scratch(card, 0);
    expect(r.event.kind).toBe("win");
    expect(r.event.won).toBe(card.cells[0].won);
    expect(r.card.cells[0].scratched).toBe(true);
  });

  it("rejects out-of-range index", () => {
    const card = generateCard({ rows: 2, cols: 2 });
    const r = scratch(card, 99);
    expect(r.event.kind).toBe("invalid");
    expect(r.event.reason).toBe("out-of-range");
  });

  it("rejects scratching an already-scratched cell", () => {
    const card = generateCard({ rows: 2, cols: 2 });
    const once = scratch(card, 0);
    const twice = scratch(once.card, 0);
    expect(twice.event.kind).toBe("invalid");
    expect(twice.event.reason).toBe("already-scratched");
  });

  it("scratch is immutable (does not mutate input)", () => {
    const card = generateCard({ rows: 2, cols: 2 });
    scratch(card, 1);
    expect(card.cells[1].scratched).toBe(false);
  });
});

describe("scratchedCount / isFullyScratched", () => {
  it("counts scratched cells", () => {
    let card = generateCard({ rows: 2, cols: 2 });
    card = scratch(card, 0).card;
    card = scratch(card, 2).card;
    expect(scratchedCount(card)).toBe(2);
  });

  it("isFullyScratched true only when all opened", () => {
    let card = generateCard({ rows: 2, cols: 2 });
    expect(isFullyScratched(card)).toBe(false);
    for (let i = 0; i < card.cells.length; i++) card = scratch(card, i).card;
    expect(isFullyScratched(card)).toBe(true);
  });
});

describe("hasThreeSame", () => {
  it("detects three consecutive same symbols", () => {
    const card = generateCard({ rows: 1, cols: 3, winRate: 1, rand: () => 0.1 });
    expect(hasThreeSame(card)).toBe(true);
  });

  it("false when no run of three", () => {
    const card = generateCard({ rows: 1, cols: 3, winRate: 0, rand: () => 0.9 });
    expect(hasThreeSame(card)).toBe(false);
  });
});

describe("settle", () => {
  it("returns null until fully scratched", () => {
    const card = generateCard({ rows: 2, cols: 2 });
    expect(settle(card)).toBeNull();
  });

  it("awards 大獎 when three same appear", () => {
    let card = generateCard({ rows: 1, cols: 3, winRate: 1, rand: () => 0.1 });
    for (let i = 0; i < card.cells.length; i++) card = scratch(card, i).card;
    const s = settle(card);
    expect(s.prize).toBe("大獎");
    expect(s.three).toBe(true);
  });

  it("awards 銘謝惠顧 when nothing won", () => {
    let card = generateCard({ rows: 1, cols: 3, winRate: 0, rand: () => 0.9 });
    for (let i = 0; i < card.cells.length; i++) card = scratch(card, i).card;
    const s = settle(card);
    expect(s.prize).toBe("銘謝惠顧");
    expect(s.won).toBe(0);
  });
});

describe("prizeCounts", () => {
  it("tallies won symbols", () => {
    const card = generateCard({ rows: 1, cols: 4, winRate: 1, rand: () => 0.1 });
    const counts = prizeCounts(card);
    expect(counts["○"]).toBe(4);
  });
});