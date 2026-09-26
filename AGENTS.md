<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Recommendations come only from `src/services/recommendationService.ts` (`getRecommendations(profile)`), mocked for now — it will be swapped for an HTTP call to a Java/Spring Boot backend, so UI never reads mock data directly.
- Mock catalog lives in `src/data/`; UI components live in `src/components/gift/`; flow state lives in `src/hooks/useGiftFlow.ts` around a single `GiftProfile` object.
- Analytics go through `src/services/analytics.ts` (console mock) so a real sink can be plugged in later.
- No login, database access, admin panel or real AI in this MVP (per product brief); existing Cloud tables are left untouched but unused.
