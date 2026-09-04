/*
 * `@wordpress/interface` ships untyped JavaScript resolved through gitignored
 * build artifacts; the base tsconfig maps the package here so type checking
 * never depends on those artifacts existing.
 */
declare module '@wordpress/interface' {
	import type { StoreDescriptor } from '@wordpress/data';

	export const store: StoreDescriptor;
}
