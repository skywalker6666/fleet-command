# CardSense Benefit-Plan Implementation Plan
Last updated: 2026-04-06

## Proven Pattern

The implementation pattern for switching cards (established via CATHAY_CUBE, validated on ESUN_UNICARD and TAISHIN_RICHART):

1. Keep top-level `category` stable
2. Add meaningful `subcategory`
3. Model stable clusters as promotions
4. Attach merchant-level conditions inside cluster promos
5. Keep runtime-only state explicit in request payload
6. Roll out with scoped sync when only one card is production-ready

## Current Product Decisions

### Tier default policy

When tier state is unknown, default conservatively:
- `CATHAY_CUBE` defaults to `LEVEL_1`
- `LEVEL_2` / `LEVEL_3` require explicit request

### Merchant modeling policy

Prefer cluster promo + merchant conditions. Do not create one promo row per merchant unless the bank truly structures it that way.

### Rollout policy

If only one card is ready, prefer scoped rollout (e.g. `--sync-bank CATHAY --sync-card CATHAY_CUBE`).

## Remaining Gaps

### Runtime plan-state beyond tiers

Not yet modeled: month-end final plan state, merchant-slot selection, unlock/subscription state. Priority card: `ESUN_UNICARD`.

### Rail and routing-sensitive rules

Not yet modeled: wallet/payment rail, MCC semantics, transaction country, billing currency. Priority card: `TAISHIN_RICHART`.

### Frontend refinement

Still worth improving: smarter merchant suggestions by category/subcategory, better tier assumption copy, richer condition grouping.

## Canonical References

- Skill: `cardsense-extractor/skills/cardsense-bank-promo-review`
- Workflow: `fleet-command/CardSense-Bank-Promo-Review-Workflow.md`
