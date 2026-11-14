import { useCallback, useState } from '@wordpress/element';
import {
	getWpCompatOverlayContainer,
	getWpCompatOverlaySlot,
} from './wp-compat-overlay-slot';

/**
 * Resolve a default portal destination from its source in the DOM. Waiting for
 * the source ref also covers initially open overlays and separate package copies.
 * Remove the marker after capturing its parent so editable content stays clean.
 * Explicit containers, including null, keep their normal precedence.
 *
 * @param container The consumer's explicit portal container.
 */
export function useWpCompatOverlayContainer< Container >(
	container: Container
) {
	const [ sourceParent, setSourceParent ] = useState< Element | null >(
		null
	);
	const setSource = useCallback( ( node: HTMLSpanElement | null ) => {
		if ( node ) {
			setSourceParent( node.parentElement ?? node.ownerDocument.body );
		}
	}, [] );
	const hasSource = sourceParent !== null;
	let resolvedContainer: Container | HTMLElement | null | undefined =
		container;
	if ( container === undefined ) {
		resolvedContainer = hasSource
			? ( getWpCompatOverlayContainer( sourceParent ) ??
				getWpCompatOverlaySlot() )
			: null;
	}
	return {
		setSource,
		needsSource: container === undefined && ! hasSource,
		container: resolvedContainer,
	};
}
