/**
 * WordPress dependencies
 */
import { isEntirelySelected } from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useRefEffect } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useSelectAll() {
	const { getBlockOrder, getSelectedBlockClientIds, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { multiSelect, selectBlock } = useDispatch( blockEditorStore );
	const scope = useRef();
	useShortcut(
		'core/block-editor/select-all',
		( event ) => {
			const selectedClientIds = getSelectedBlockClientIds();

			if (
				selectedClientIds.length < 2 &&
				! isEntirelySelected( event.target )
			) {
				return;
			}

			event.preventDefault();

			const [ firstSelectedClientId ] = selectedClientIds;
			const rootClientId = getBlockRootClientId( firstSelectedClientId );
			const blockClientIds = getBlockOrder( rootClientId );

			// If we have selected all sibling nested blocks, try selecting up a
			// level. See: https://github.com/WordPress/gutenberg/pull/31859/
			if ( selectedClientIds.length === blockClientIds.length ) {
				if ( rootClientId ) {
					scope.current.ownerDocument.defaultView
						.getSelection()
						.removeAllRanges();
					selectBlock( rootClientId );
				}
				return;
			}

			multiSelect(
				blockClientIds[ 0 ],
				blockClientIds[ blockClientIds.length - 1 ]
			);
		},
		{ scope }
	);

	return useRefEffect( ( node ) => {
		scope.ref = node;
	}, [] );
}
