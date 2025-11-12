/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

function listener( event ) {
	if ( event.defaultPrevented ) {
		return;
	}

	event.preventDefault();
	event.currentTarget.classList.toggle(
		'is-hovered',
		event.type === 'mouseover'
	);
}

/*
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 */
export function useIsHovered() {
	return useRefEffect( ( node ) => {
		node.addEventListener( 'mouseout', listener );
		node.addEventListener( 'mouseover', listener );

		return () => {
			node.removeEventListener( 'mouseout', listener );
			node.removeEventListener( 'mouseover', listener );

			// Remove class in case it lingers.
			node.classList.remove( 'is-hovered' );
		};
	}, [] );
}
