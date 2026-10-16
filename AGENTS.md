# Agent Guidelines for Ride Efficiency Mobile

## Git Workflow Rules

**CRITICAL**: Never merge directly to `main` branch. All changes must go through Pull Requests.

### Branch Strategy
- `main` - Protected branch, only receives changes via approved PRs
- `feature/*` - Feature branches for new functionality
- `fix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes for production

### Required Workflow
1. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit to the feature branch
3. Push feature branch to remote: `git push origin feature/your-feature-name`
4. Create Pull Request on GitHub
5. Get approval and merge via PR (never direct merge)
6. Delete feature branch after merge

### Never Do
- ❌ `git checkout main` followed by merge or commits
- ❌ `git push origin main` directly
- ❌ `git merge feature/*` while on main
- ❌ Force push to main

### If You Accidentally Modified Main
1. Immediately reset main to the correct commit: `git reset --hard <correct-commit>`
2. Move your changes to a feature branch
3. Follow the proper PR workflow

## Expo/React Native Guidelines

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

### Expo Version Compatibility
Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands
Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

### Navigation & Routing
- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

### Building with EAS
Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules
- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Verification Steps

Before declaring any task complete:
1. Run `npx expo lint` - should have 0 errors
2. Run `npx tsc --noEmit` - should have 0 errors
3. Test the functionality if applicable
4. Verify no regressions in related features

## Code Style

- Compact code – collapse duplicate else branches, avoid unnecessary nesting
- Follow idiomatic conventions for the language
- Avoid excessive error handling in every line - think about right error boundaries
- Don't add or remove comments unless asked
- If you accidentally deleted a comment, put it back
