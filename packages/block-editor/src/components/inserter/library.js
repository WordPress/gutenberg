/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { store as blockEditorStore } from '../../store';

function InserterLibrary( {
	rootClientId,
	clientId,
	index,
	isAppender,
	showInserterHelpPanel,
	showMostUsedBlocks = false,
	__experimentalInsertionIndex,
	onSelect = noop,
	shouldFocusBlock = false,
} ) {
	const { destinationRootClientId, destinationClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockOrder } = select(
				blockEditorStore
			);
			const _destinationRootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;
			const order = getBlockOrder( _destinationRootClientId );
			return {
				destinationRootClientId: _destinationRootClientId,
				destinationClientId: clientId || order[ index ],
			};
		},
		[ clientId, rootClientId, index ]
	);

	return (
		<InserterMenu
			onSelect={ onSelect }
			rootClientId={ destinationRootClientId }
			clientId={ destinationClientId }
			isAppender={ isAppender }
			showInserterHelpPanel={ showInserterHelpPanel }
			showMostUsedBlocks={ showMostUsedBlocks }
			__experimentalInsertionIndex={ __experimentalInsertionIndex }
			shouldFocusBlock={ shouldFocusBlock }
		/>
	);
}

export default InserterLibrary;
