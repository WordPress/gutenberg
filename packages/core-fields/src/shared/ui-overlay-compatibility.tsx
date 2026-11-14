import { isValidElement } from '@wordpress/element';
import type { FieldsScriptParts } from '../types';

/** Forward support from the owner of the exact rendered component. */
export function forwardUiOverlaySupport< Component extends object >(
	component: Component,
	owner: object
): Component {
	return Object.defineProperties( component, {
		supportsUiOverlays: {
			get: () =>
				Object.hasOwn( owner, 'supportsUiOverlays' ) &&
				Reflect.get( owner, 'supportsUiOverlays' ) === true,
			configurable: true,
		},
		subscribeUiOverlaySupport: {
			value: ( listener: () => void ) => {
				const subscribe =
					Object.hasOwn( owner, 'subscribeUiOverlaySupport' ) &&
					Reflect.get( owner, 'subscribeUiOverlaySupport' );
				if ( typeof subscribe !== 'function' ) {
					return () => {};
				}
				const unsubscribe = subscribe.call( owner, listener );
				return typeof unsubscribe === 'function'
					? unsubscribe
					: () => {};
			},
			configurable: true,
		},
	} );
}

/**
 * Declare compatibility on Core's actual renderers. Replacing a renderer does
 * not copy this declaration. Rich static content gets its own attested wrapper.
 */
export function withUiOverlayCompatibility< Item >(
	fields: FieldsScriptParts< Item >
): FieldsScriptParts< Item > {
	for ( const [ id, field ] of Object.entries( fields ) ) {
		const mediaField = [
			'featured_media',
			'site_logo',
			'site_icon',
		].includes( id );
		for ( const key of [ 'Edit', 'render' ] as const ) {
			const renderer = field[ key ];
			if (
				renderer &&
				( typeof renderer === 'function' ||
					typeof renderer === 'object' ) &&
				Object.hasOwn( renderer, 'supportsUiOverlays' )
			) {
				continue;
			}
			if ( key === 'Edit' && mediaField ) {
				continue;
			}
			if (
				typeof renderer === 'function' ||
				( renderer &&
					typeof renderer === 'object' &&
					'$$typeof' in renderer )
			) {
				Object.defineProperty( renderer, 'supportsUiOverlays', {
					get: () => true,
					configurable: true,
				} );
			}
		}
		for ( const key of [ 'header', 'description' ] as const ) {
			const content = field[ key ];
			if ( isValidElement( content ) ) {
				const CompatibleContent = Object.assign( () => content, {
					supportsUiOverlays: true,
				} );
				field[ key ] = <CompatibleContent />;
			}
		}
	}
	return fields;
}
