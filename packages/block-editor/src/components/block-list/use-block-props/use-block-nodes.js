/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { SetBlockNodes } from '../';

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 *
 * @param {string} clientId Block client ID.
 */
export function useBlockNodes( clientId ) {
	const setBlockNodes = useContext( SetBlockNodes );
	const isNeeded = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				isFirstMultiSelectedBlock,
				getLastMultiSelectedBlockClientId,
			} = select( blockEditorStore );
			return (
				isBlockSelected( clientId ) ||
				isFirstMultiSelectedBlock( clientId ) ||
				getLastMultiSelectedBlockClientId() === clientId
			);
		},
		[ clientId ]
	);

	// Provide the selected node, or the first and last nodes of a multi-
	// selection, so it can be used to position the contextual block toolbar.
	// We only provide what is necessary, and remove the nodes again when they
	// are no longer selected.
	return useRefEffect(
		( node ) => {
			if ( ! isNeeded ) {
				return;
			}

			setBlockNodes( ( nodes ) => ( {
				...nodes,
				[ clientId ]: node,
			} ) );

			return () => {
				setBlockNodes( ( nodes ) => omit( nodes, clientId ) );
			};
		},
		[ isNeeded, clientId, setBlockNodes ]
	);
}
