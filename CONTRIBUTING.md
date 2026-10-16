# Contributing

Thanks for helping improve Ride Efficiency Mobile. Keep changes focused, reviewable, and compatible with the current Expo SDK.

## Development setup

1. Use a supported Node.js LTS version compatible with the Expo SDK in `package.json`.
2. Install the lockfile dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and configure `EXPO_PUBLIC_API_URL` for your local API.
4. Start the app with `npm start` and use Expo Go or a development build as appropriate.

## Project conventions

- This is an Expo / React Native app. Prioritize mobile-first interaction, accessibility, performance, and iOS/Android compatibility.
- Before using or changing Expo, EAS, or React Native APIs, check the installed Expo major version in `package.json` and consult the matching versioned Expo documentation. Prefer Expo SDK-compatible packages installed through `npx expo install`.
- Use Expo Router for navigation. Route screens belong in `src/app/`; shared components, hooks, API clients, and utilities belong outside that directory.
- Keep API request/response types and endpoint wrappers centralized in `src/lib/types.ts` and `src/lib/endpoints.ts`; do not build API URLs in screens.
- Use the shared design tokens and UI components before introducing new colors, spacing, or one-off controls.
- Put user-facing strings in both English and Spanish in `src/lib/i18n.ts`. Use translation keys from `useLanguage()`; English is the fallback when a translation is missing or device language is unsupported.
- Handle loading, empty, error, and disabled states for asynchronous screens and forms. Do not log credentials, access tokens, or other secrets.
- Native `ios/` and `android/` folders are generated. Do not add or edit them manually; configure native behavior through Expo app config and plugins.
- Keep commits small and scoped. Never commit `.env` files, credentials, tokens, or generated `dist/` output.

## Branches and commits

- Use a short, descriptive branch name such as `feature/vehicle-management` or `fix/shift-detail-safe-area`.
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): imperative summary`. Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, and `chore`.
- Make one logical change per commit. Add a body when context or a breaking change needs explanation; mark breaking changes with `!` and a `BREAKING CHANGE:` footer.
- Open changes through a pull request; describe the behavior and rationale, link relevant issues, list verification performed, and include screenshots for UI changes where useful.

## Before opening a pull request

Run these checks from the repository root:

```sh
npm ci
npm run lint
npm run typecheck
npx expo-doctor
```

For native-module or route changes, also confirm Expo can bundle the affected platform(s), or test in a development build when Expo Go does not include the native module. Mention checks that could not be run in the pull request.

## Pull request checklist

- [ ] The change is focused and follows the conventions above.
- [ ] User-facing strings are translated in English and Spanish.
- [ ] Loading, empty, error, and validation states are handled where applicable.
- [ ] `npm run lint` and `npm run typecheck` pass.
- [ ] Expo Doctor and any relevant platform bundle/device checks are reported.
- [ ] UI changes include screenshots or a short screen recording when useful.
- [ ] No secrets, local environment files, or generated output are included.
