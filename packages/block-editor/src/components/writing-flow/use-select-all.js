/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { isEntirelySelected } from '@wordpress/dom';
import { useRef, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useSelectAll() {
	const ref = useRef();
	const {
		getBlockOrder,
		getSelectedBlockClientIds,
		getBlockRootClientId,
	} = useSelect( blockEditorStore );
	const { multiSelect } = useDispatch( blockEditorStore );

	const callback = useCallback( ( event ) => {
		const selectedClientIds = getSelectedBlockClientIds();

		if ( ! selectedClientIds.length ) {
			return;
		}

		if (
			selectedClientIds.length === 1 &&
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
	}, [] );

	useShortcut( 'core/block-editor/select-all', callback, {
		target: ref,
	} );

	return ref;
}
