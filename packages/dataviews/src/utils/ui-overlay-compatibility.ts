import { isValidElement } from '@wordpress/element';
import { Modal, Popover as WCPopover } from '@wordpress/components';

/**
 * A declaration belongs to the actual renderer, not an inherited class member.
 * @param component
 */
export function isUiOverlayCompatible( component: unknown ): boolean {
	return (
		( typeof component === 'function' ||
			( typeof component === 'object' && component !== null ) ) &&
		Object.hasOwn( component, 'supportsUiOverlays' ) &&
		Reflect.get( component, 'supportsUiOverlays' ) === true
	);
}

/**
 * Subscribe through each actual owner's API, including independently bundled owners.
 * @param owners
 * @param listener
 */
export function subscribeToUiOverlaySupport(
	owners: readonly unknown[],
	listener: () => void
): () => void {
	const cleanups = [ ...new Set( owners ) ].map( ( owner ) => {
		if (
			! owner ||
			( typeof owner !== 'function' && typeof owner !== 'object' ) ||
			! Object.hasOwn( owner, 'subscribeUiOverlaySupport' )
		) {
			return undefined;
		}
		const subscribe = Reflect.get( owner, 'subscribeUiOverlaySupport' );
		return typeof subscribe === 'function'
			? subscribe.call( owner, listener )
			: undefined;
	} );
	return () =>
		cleanups.forEach( ( cleanup ) => {
			if ( typeof cleanup === 'function' ) {
				cleanup();
			}
		} );
}

/** Check both a bundled copy and the Components supplied by WordPress. */
export function supportsUiOverlays(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	const globalComponents = (
		window as Window & {
			wp?: { components?: { Modal?: unknown; Popover?: unknown } };
		}
	 ).wp?.components;
	return (
		isUiOverlayCompatible( Modal ) &&
		isUiOverlayCompatible( WCPopover ) &&
		( ! globalComponents ||
			( isUiOverlayCompatible( globalComponents.Modal ) &&
				isUiOverlayCompatible( globalComponents.Popover ) ) )
	);
}

/**
 * Check rich content without treating arrays or portals as plain text.
 * @param content
 */
export function isUiOverlayContentCompatible( content: unknown ): boolean {
	if ( Array.isArray( content ) ) {
		return content.every( isUiOverlayContentCompatible );
	}
	return (
		content === null ||
		content === undefined ||
		[ 'string', 'number', 'boolean' ].includes( typeof content ) ||
		( isValidElement( content ) && isUiOverlayCompatible( content.type ) )
	);
}

/**
 * Collect the actual component owners of rich content.
 * @param content
 */
export function getUiOverlayContentOwners( content: unknown ): unknown[] {
	if ( Array.isArray( content ) ) {
		return content.flatMap( getUiOverlayContentOwners );
	}
	return isValidElement( content ) ? [ content.type ] : [];
}
