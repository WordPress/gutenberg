/*
 * `@wordpress/block-library` ships untyped JavaScript resolved through
 * gitignored build artifacts; this ambient declaration covers the surface this
 * package consumes so type builds don't depend on those artifacts existing.
 */
declare module '@wordpress/block-library' {
	export const privateApis: Record< string, unknown >;
}
