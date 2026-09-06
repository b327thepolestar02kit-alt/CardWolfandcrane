CardWolf build / data hierarchy recovery

Canonical structure:
  data/cards.js
  data/cards.config.json
  images/                 <- card images prepared by prepare_cards.cmd
  assets/                 <- game/crane assets
  index.html
  crane.html
  app.js
  prepare_cards.cmd
  prepare_cards.ps1
  verify-build.cmd
  verify-build.ps1
  verify-build.py

The game loads data/cards.js directly. The preparation script uses the same
path, and card images are always written to images/. The card data file is
updated only after all requested images have succeeded, preventing partial
data corruption after a failed download.

Crane:
  100 medals/play, queued prepaid plays, no 3-2-1 countdown,
  left/home return before GET, and no mutation of CardWolf wins/losses.
  The active crane implementation is crane.html.

Commands:
  verify-build.cmd
  verify-build.cmd --require-images
  prepare_cards.cmd

prepare_cards.cmd requires network access to the YGOPRODeck API.


## v490 クレーン修正
- 待機・左右移動時は、耳・アーム・ケーブルを一体化した `ready_full.png` を使用し、左端・右端でのクリッピングを抑制。
- 失敗時のホーム到達後は `fail_drop_clean.png` を使用し、本体の口周りとアームの位置を一体表示。
- 成功運搬中の滑落が発生した場合、滑落地点で即座に失敗表情へ切り替え、そのまま左端へ戻る。

[v492] The distributable ZIP intentionally omits the images/ directory. prepare_cards.cmd recreates it when card images are needed.
