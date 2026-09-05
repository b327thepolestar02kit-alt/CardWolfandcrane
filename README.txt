CardWolf v399

Crane game: v360-v399 reference-video visual finish pass.

Visual direction now reflects the supplied crane-game reference more closely: rounded white cabinet, pastel cyan/pink playfield, soft candy lighting, colorful mechanical trim, rounded crane carriage, and brighter prize presentation. No third-party branding is reproduced.
Gameplay rules remain unchanged: 100 medals/play, queued prepaid plays, left-home return flow, no countdown, crane does not mutate CardWolf wins/losses.
Added HUD, aim, movement, stack, carry, return, queue, GET, accessibility, and responsive polish in 30 implementation stages.

No KONAMI branding is included.

v419 visual asset integration:
- Integrated user-supplied Yummy character assets after background-removal processing.
- Character artwork was normalized to a common in-game visual size.
- Integrated the supplied machine background.
- The supplied normal and descent crane artwork is used as the cleanest safely-separated crane visual states.
- Background-heavy success/fail crane reference images are packaged as processed assets but are not forced into gameplay where their residual scene background could reduce visual quality.
- Existing gameplay odds, medal cost, queued play, left-home route, and CardWolf win/loss isolation remain unchanged.

v439 update:
- User-supplied button_logo.png is used for the CardWolf home crane CTA and PRIZE CATCHER header.
- All supplied crane state images are now mapped to ready/descend/success/success_drop/fail/fail_drop states.
- Prize acquisition chance is slightly increased from the v209 balance without changing cost or queue flow.
- Prize image CSS no longer desaturates distant prizes, improving fidelity to supplied artwork.


v469: Rebuilt from user-supplied cleaned Yummy artwork. Character assets normalized to a common visible size; source colors preserved; updated crane state art, background, and button logo.

CardWolf v479 — motion smoothing + collection readability + fail claw transparency.
