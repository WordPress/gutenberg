/*
 * `@wordpress/commands` ships untyped JavaScript resolved through gitignored
 * build artifacts; the base tsconfig maps the package here so type checking
 * never depends on those artifacts existing.
 */
declare module '@wordpress/commands' {
	import type { StoreDescriptor } from '@wordpress/data';

	export function CommandMenu(): JSX.Element | null;
	export function useCommand( command: unknown ): void;
	export function useCommands( commands: unknown[] ): void;
	export function useCommandLoader( loader: unknown ): void;
	export const privateApis: Record< string, unknown >;
	export const store: StoreDescriptor;
}
