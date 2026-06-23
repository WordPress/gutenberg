/*
 * `@wordpress/commands` ships untyped JavaScript resolved through gitignored
 * build artifacts; this ambient declaration covers the surface this package
 * consumes so type builds don't depend on those artifacts existing.
 */
declare module '@wordpress/commands' {
	import type { StoreDescriptor } from '@wordpress/data';

	export function useCommands( commands: unknown[] ): void;
	export const privateApis: Record< string, unknown >;
	export const store: StoreDescriptor;
}
