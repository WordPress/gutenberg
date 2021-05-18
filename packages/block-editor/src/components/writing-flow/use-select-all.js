/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { isEntirelySelected } from '@wordpress/dom';
import { isKeyboardEvent } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useSelectAll() {
	const { getBlockOrder } = useSelect( blockEditorStore );
	const { multiSelect } = useDispatch( blockEditorStore );

	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if (
				isKeyboardEvent.primary( event, 'a' ) &&
				isEntirelySelected( event.target )
			) {
				const blocks = getBlockOrder();
				const firstClientId = first( blocks );
				const lastClientId = last( blocks );
				if ( firstClientId !== lastClientId ) {
					multiSelect( firstClientId, lastClientId );
					event.preventDefault();
				}
			}
		}

		node.addEventListener( 'keydown', onKeyDown );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
