/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { isEntirelySelected } from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useSelectAll() {
	const {
		getBlockOrder,
		getSelectedBlockClientIds,
		getBlockRootClientId,
	} = useSelect( blockEditorStore );
	const { multiSelect } = useDispatch( blockEditorStore );
	const isMatch = useShortcutEventMatch();

	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( ! isMatch( 'core/block-editor/select-all', event ) ) {
				return;
			}

			const selectedClientIds = getSelectedBlockClientIds();

			if (
				selectedClientIds.length < 2 &&
				! isEntirelySelected( event.target )
			) {
				return;
			}

			const [ firstSelectedClientId ] = selectedClientIds;
			const rootClientId = getBlockRootClientId( firstSelectedClientId );
			let blockClientIds = getBlockOrder( rootClientId );

			// If we have selected all sibling nested blocks, try selecting up a
			// level. See: https://github.com/WordPress/gutenberg/pull/31859/
			if ( selectedClientIds.length === blockClientIds.length ) {
				blockClientIds = getBlockOrder(
					getBlockRootClientId( rootClientId )
				);
			}

			const firstClientId = first( blockClientIds );
			const lastClientId = last( blockClientIds );

			if ( firstClientId === lastClientId ) {
				return;
			}

			multiSelect( firstClientId, lastClientId );
			event.preventDefault();
		}

		node.addEventListener( 'keydown', onKeyDown );

		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
