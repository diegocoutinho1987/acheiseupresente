# Architecture rules

- Recommendations come only from `src/services/recommendationService.ts` (`getRecommendations(profile)`) — swap point for a future Java/Spring Boot backend; UI never reads catalog data directly.
- Catalog is read from the Cloud `products` table via `src/services/catalogService.ts`, falling back to `src/data/products.ts` demo data — so admins manage products without code changes.
- Admin area: `/admin` under `_authenticated`, guarded by `has_role(admin)`; first signup becomes admin (DB trigger) — no public signup gate needed beyond role check.
- UI components live in `src/components/gift/`; flow state lives in `src/hooks/useGiftFlow.ts` around a single `GiftProfile`.
- Analytics go through `src/services/analytics.ts` (console mock) so a real sink can be plugged in later.
- No real AI in this MVP.
