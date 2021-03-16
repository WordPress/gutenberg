/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SetBlockNodes } from '../';
import { store as blockEditorStore } from '../../../store';

export function useBlockNodes( clientId ) {
	const setBlockNodes = useContext( SetBlockNodes );
	// Provide the selected node, or the first and last nodes of a multi-
	// selection, so it can be used to position the contextual block toolbar.
	// We only provide what is necessary, and remove the nodes again when they
	// are no longer selected.
	const isNodeNeeded = useSelect(
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
		}
		// To do: figure out why tests are failing when dependencies are added.
		// This data was originally retrieved with `withSelect` in `block.js`.
		// For some reason, adding `clientId` as a dependency results in
		// `toolbar-roving-tabindex.test.js` e2e test failures.
	);

	return useRefEffect(
		( node ) => {
			if ( ! isNodeNeeded ) {
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
		[ isNodeNeeded, clientId, setBlockNodes ]
	);
}
