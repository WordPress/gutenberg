/*
 * Fallback for CSS Modules when a sibling `*.d.ts` has not been generated yet.
 * `typed-css-modules` writes `foo.module.css.d.ts` next to `foo.module.css`;
 * TypeScript prefers that file, so unknown class names become real errors.
 * Keep these wildcards so a missing declaration still type-checks as a string
 * map instead of falling through to the untyped `*.css` module below.
 */
declare module '*.module.css' {
	const classes: { [ key: string ]: string };
	export default classes;
}

declare module '*.module.scss' {
	const classes: { [ key: string ]: string };
	export default classes;
}

declare module '*.css';
declare module '*.scss';
