/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

function listener( event ) {
	if ( event.defaultPrevented ) {
		return;
	}

	const action = event.type === 'mouseover' ? 'add' : 'remove';

	event.preventDefault();
	event.currentTarget.classList[ action ]( 'is-hovered' );
}

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 */
export function useIsHovered() {
	const isEnabled = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().outlineMode;
	}, [] );

	return useRefEffect(
		( node ) => {
			if ( isEnabled ) {
				node.addEventListener( 'mouseout', listener );
				node.addEventListener( 'mouseover', listener );

				return () => {
					node.removeEventListener( 'mouseout', listener );
					node.removeEventListener( 'mouseover', listener );

					// Remove class in case it lingers.
					node.classList.remove( 'is-hovered' );
				};
			}
		},
		[ isEnabled ]
	);
}
