type OverlaySupport = {
	readonly supportsUiOverlays: boolean;
	subscribeUiOverlaySupport: ( listener: () => void ) => () => void;
};

export function hasUiOverlaySupport( component: unknown ): boolean {
	return (
		( typeof component === 'function' ||
			( typeof component === 'object' && component !== null ) ) &&
		Object.hasOwn( component, 'supportsUiOverlays' ) &&
		Reflect.get( component, 'supportsUiOverlays' ) === true
	);
}

/**
 * Forward the actual owners' subscriptions without sharing a React context.
 * @param component
 * @param getSupport
 * @param owners
 */
export function withUiOverlaySupport< Component extends object >(
	component: Component,
	getSupport: () => boolean,
	owners: readonly unknown[] = []
): Component & OverlaySupport {
	return Object.defineProperties( component, {
		supportsUiOverlays: { get: getSupport, configurable: true },
		subscribeUiOverlaySupport: {
			value: ( listener: () => void ) => {
				const cleanups = owners.map( ( owner ) => {
					if (
						! owner ||
						( typeof owner !== 'function' &&
							typeof owner !== 'object' ) ||
						! Object.hasOwn( owner, 'subscribeUiOverlaySupport' )
					) {
						return undefined;
					}
					const subscribe = Reflect.get(
						owner,
						'subscribeUiOverlaySupport'
					);
					if ( typeof subscribe !== 'function' ) {
						return undefined;
					}
					return subscribe.call( owner, listener );
				} );
				return () =>
					cleanups.forEach( ( cleanup ) => {
						if ( typeof cleanup === 'function' ) {
							cleanup();
						}
					} );
			},
			configurable: true,
		},
	} ) as Component & OverlaySupport;
}
