const INSTANCE_KEY = Symbol.for( '@wordpress/widget-primitives' );

let claimed = false;

/**
 * Registers this instance of the package on the global scope and warns,
 * while developing, when another one already did. Everything the package
 * keeps at module scope (the host context, the field type and icon
 * registries) exists once per instance, so a second instance splits
 * providers and registrations from their consumers without any error.
 * Packages that build on this one declare it as a peer dependency to keep
 * it single; see the README.
 */
export function claimInstance(): void {
	if ( claimed || process.env.NODE_ENV === 'production' ) {
		return;
	}
	claimed = true;

	const scope = globalThis as Record< symbol, unknown >;
	if ( scope[ INSTANCE_KEY ] ) {
		// eslint-disable-next-line no-console
		console.warn(
			'@wordpress/widget-primitives: a second instance of the package evaluated; host capabilities and registrations do not cross instances. Resolve the package once per application.'
		);
		return;
	}

	scope[ INSTANCE_KEY ] = true;
}
