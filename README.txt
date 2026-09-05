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
