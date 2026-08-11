# 刮刮樂（Scratch-Off）

夜市機台風格的**數位刮刮卡**：刮開格子，找出 3 個相同符號連在一起就中獎。**純娛樂、非真實博弈**，獎項為虛擬名目，無任何現金價值。

## 玩法

1. 一張卡有 6×3＝18 格，每格底下藏 ○（中獎）或 ✕（沒中）。
2. 點／刮一格把刮層刮開，露出符號。
3. 整卡刮完自動結算：刮到 **3 個相同符號連續排列**即中「大獎」；有中獎格但未連 3 個為「小獎」；全沒中則「銘謝惠顧」。

## 操作

- **滑鼠／觸控**：點刮層刮開格子。
- **換一張**：重新生成一張刮卡。
- 聲音開關在右上角（骰子／硬幣 ogg ＋ Web Audio 合成音效，見 `assets/sfx/`）。

## 技術

- `game.js`：純函式邏輯（生成刮卡、刮開判定、3 連判定、結算、獎池統計）。
- `app.js`：DOM 渲染、刮層互動（CSS radial-gradient mask）、結算、KV 最佳中獎格數。
- `audio.js`：Kenney Casino Audio（ogg）＋ Web Audio 合成音效。
- 最佳中獎格數存 `/api/kv/pg-guaguale-best`（Playgrounds KV）。

## 試玩

```bash
npx --yes serve .
```

瀏覽 `http://localhost:3000`。

## 測試

```bash
npx --yes vitest@latest run
```

## 授權

- 程式碼：MIT（見 `LICENSE`）。
- 音效：Kenney.nl — Casino Audio（CC0，見 `assets/sfx/`）。
- 按鈕：Kenney.nl — UI Pack（CC0，見 `assets/ui/`）。
- 詳細署名見 `ATTRIBUTION.md`。