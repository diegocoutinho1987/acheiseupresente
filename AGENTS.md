# Architecture rules

- Recommendations come only from `src/services/recommendationService.ts` (`getRecommendations(profile)`) — swap point for a future Java/Spring Boot backend; UI never reads catalog data directly.
- Deterministic filtering, scoring, explanations, and diversification live as pure functions in `src/services/recommendationEngine.ts` so the rules remain testable and independent from data access.
- The Cloud `products` table is the only operational catalog source. `productService.ts` owns database access; `catalogService.ts` adapts active rows for recommendations. Never restore a local fallback.
- Admin area: `/admin` is a protected layout guarded by `has_role(admin)` with dashboard, product list, new and edit routes; all catalog CRUD goes through `src/services/productService.ts` so a future API can replace it in one place.
- UI components live in `src/components/gift/`; flow state lives in `src/hooks/useGiftFlow.ts` around a single `GiftProfile`.
- Analytics go through `src/services/analytics.ts` (console mock) so a real sink can be plugged in later.
- No real AI in this MVP.
