/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/*
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 */
export function useIsHovered( { clientId } ) {
	const { hoverBlock } = useDispatch( blockEditorStore );

	function listener( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		const action = event.type === 'mouseover' ? 'add' : 'remove';

		event.preventDefault();
		event.currentTarget.classList[ action ]( 'is-hovered' );

		if ( action === 'add' ) {
			hoverBlock( clientId );
		} else {
			hoverBlock( null );
		}
	}

	return useRefEffect( ( node ) => {
		node.addEventListener( 'mouseout', listener );
		node.addEventListener( 'mouseover', listener );

		return () => {
			node.removeEventListener( 'mouseout', listener );
			node.removeEventListener( 'mouseover', listener );

			// Remove class in case it lingers.
			node.classList.remove( 'is-hovered' );
			hoverBlock( null );
		};
	}, [] );
}
