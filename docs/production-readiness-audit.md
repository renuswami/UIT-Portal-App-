# Production Readiness Audit

## Scope
This review covers architecture, code quality, security, performance, and anti-patterns in the current Expo React Native app.

## Critical issues

1. **Build is currently broken (missing auth service + type errors).**
   - `authService` is imported in multiple files, but `src/services/auth.service.ts` does not exist in the repository.
   - TypeScript also fails on missing style key (`subHeaderContent`) and invalid `Pressable` callback state (`hovered`) typing assumptions.
   - **Recommendation:** Restore/implement `auth.service.ts`; add strict CI type-check step; fix style/type errors before merge gates.

2. **SOQL injection risk due to string interpolation with user-controlled values.**
   - Queries interpolate `email`, `accountId`, and IDs directly into SOQL strings.
   - **Recommendation:** introduce centralized query builders that escape values (single quotes, control chars), validate ID formats, and avoid constructing queries from raw user input.

3. **Potential sensitive information exposure in logs.**
   - API layer and services log full query URLs and operational details that may include IDs and filters tied to user accounts.
   - **Recommendation:** add environment-aware logger, redact identifiers, disable verbose logs in production builds.

4. **Security downgrade in storage fallback.**
   - Storage falls back from SecureStore to AsyncStorage (plaintext at-rest) whenever SecureStore is unavailable/fails.
   - **Recommendation:** classify secrets by sensitivity; never store tokens in AsyncStorage; fail closed for credential/token storage, and store only non-sensitive preferences in AsyncStorage.

## High-priority architectural and quality concerns

5. **Duplicate domain service names and split responsibilities.**
   - Two different `attendanceService` modules exist (`src/services/attendance.service.ts` and `src/features/attendance/attendance.service.ts`) with unrelated concerns.
   - **Recommendation:** unify by domain-oriented architecture (feature module boundaries), and rename to explicit services (`attendanceQueryService`, `attendanceSessionService`) to avoid collisions.

6. **Navigation typing is duplicated and inconsistent across components.**
   - `RootStackParamList` is repeated in `MainLayout`, `Sidebar`, and `BottomNav` with mismatched route coverage.
   - **Recommendation:** move route types to one shared `navigation/types.ts`; enforce imports from single source of truth.

7. **Error handling is inconsistent and often swallows failures.**
   - Some methods catch and return default values (`fetchLeaveBalances`, `getActiveWorkSession`) while others throw.
   - **Recommendation:** standardize error contracts (typed Result/error model), differentiate user-facing errors vs retryable infrastructure errors.

8. **Overuse of `any` and weak typing at API boundaries.**
   - Salesforce API methods and mapping logic rely heavily on `any`.
   - **Recommendation:** define typed DTOs for Salesforce responses, runtime validation for external payloads, and replace `any` with narrowed interfaces.

## Performance concerns

9. **Calendar rendering computes many objects on every render and uses inline calculations.**
   - The attendance calendar recomputes 42 cells and per-day derived values on each render; no memoization or virtualization strategy.
   - **Recommendation:** use `useMemo` for derived calendar model, split day cell into memoized component, and avoid recomputation unless dependencies change.

10. **Client-side leave date range expansion can be expensive.**
   - Each leave record is expanded day-by-day in JavaScript for monthly data.
   - **Recommendation:** constrain query ranges tightly, pre-process on backend when possible, and use efficient date-interval utilities.

11. **Live timer updates every second causing full widget re-renders.**
   - The check-in timer updates state every second and re-renders the entire widget tree.
   - **Recommendation:** isolate timer text into memoized child component; reduce rerender surface area.

## Maintainability / anti-patterns

12. **Hardcoded API version and scattered constants.**
   - API version (`v60.0`) and many magic strings are embedded in service methods.
   - **Recommendation:** centralize config (`src/config/env.ts`) and shared constants.

13. **Placeholder or incomplete UI interactions shipped in production paths.**
   - Header buttons include no-op handlers; login has "remember me" state with no persistence behavior.
   - **Recommendation:** either implement fully or remove/feature-flag incomplete controls.

14. **Mixed web/native style hacks without abstraction.**
   - Several style objects cast to `any` for web-only properties.
   - **Recommendation:** introduce platform style helpers and typed wrappers for web-only style props.

## What is already good

1. **Session bootstrap and auth gating flow are structurally clean.**
   - App-level auth provider + loading state guard + conditional navigator flow is clear and maintainable.

2. **Storage utility encapsulates platform differences.**
   - SecureStore/AsyncStorage logic is centralized rather than duplicated across features.

3. **Some data fetches are parallelized.**
   - Attendance screen fetches monthly data and balances concurrently with `Promise.all`.

4. **Feature-oriented UI composition exists.**
   - Screens compose reusable layout/UI widgets (`MainLayout`, `CheckInWidget`, etc.), which is a strong foundation for future modularization.

## Production hardening checklist

- Add CI gates: `tsc --noEmit`, lint, and unit tests for services.
- Implement missing auth service with token lifecycle handling and refresh logic.
- Add secure config management (environment variables, no secrets in source).
- Introduce structured logging and redaction policy.
- Add API retry/backoff and cancellation for network requests.
- Add telemetry (error tracking + performance metrics).
- Add contract tests for Salesforce integration and mocked service tests for screens.
- Define and enforce coding standards (strict TypeScript, no `any`, centralized route/types).
