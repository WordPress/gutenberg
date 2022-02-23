declare module '@wordpress/data' {
	export function createRegistrySelector< T extends (selector) => F, F extends Function >( fn: T, ...any ) : F;
}
