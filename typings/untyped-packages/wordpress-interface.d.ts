/*
 * `@wordpress/interface` ships untyped JavaScript resolved through gitignored
 * build artifacts; the base tsconfig maps the package here so type checking
 * never depends on those artifacts existing. The store is left untyped, as
 * an `any` import would be, so its selectors and actions stay unchecked.
 */
declare module '@wordpress/interface' {
	export const store: any;
}
