// The NativeWind/Tailwind entry stylesheet is pulled in only when the web
// target builds, so the native bundles never carry CSS. Importing it from a
// plain module keeps the app entry (`_layout.tsx`) free of a resolvable-import
// lint error, because ESLint cannot follow a `.css` specifier.
//
// Nothing else belongs in this file: it is imported purely for its side effect.
export {};
