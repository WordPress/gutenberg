import { useState } from '@wordpress/element';
import {
	getWpCompatOverlayContainer,
	getWpCompatOverlaySlot,
} from './wp-compat-overlay-slot';

/**
 * Resolve a default portal destination from its source in the DOM. Waiting for
 * the source ref also covers initially open overlays and separate package copies.
 * Explicit containers, including null, keep their normal precedence.
 *
 * @param container The consumer's explicit portal container.
 */
export function useWpCompatOverlayContainer< Container >(
	container: Container
) {
	const [ source, setSource ] = useState< HTMLSpanElement | null >( null );
	let resolvedContainer: Container | HTMLElement | null | undefined =
		container;
	if ( container === undefined ) {
		resolvedContainer = source
			? ( getWpCompatOverlayContainer( source ) ??
				getWpCompatOverlaySlot() )
			: null;
	}
	return {
		setSource,
		container: resolvedContainer,
	};
}
