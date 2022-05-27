/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { store as blockEditorStore } from '../../store';

function InserterLibrary(
	{
		rootClientId,
		clientId,
		isAppender,
		showInserterHelpPanel,
		showMostUsedBlocks = false,
		__experimentalInsertionIndex,
		__experimentalFilterValue,
		onSelect = noop,
		shouldFocusBlock = false,
	},
	ref
) {
	const destinationRootClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return (
				rootClientId || getBlockRootClientId( clientId ) || undefined
			);
		},
		[ clientId, rootClientId ]
	);

	return (
		<InserterMenu
			onSelect={ onSelect }
			rootClientId={ destinationRootClientId }
			clientId={ clientId }
			isAppender={ isAppender }
			showInserterHelpPanel={ showInserterHelpPanel }
			showMostUsedBlocks={ showMostUsedBlocks }
			__experimentalInsertionIndex={ __experimentalInsertionIndex }
			__experimentalFilterValue={ __experimentalFilterValue }
			shouldFocusBlock={ shouldFocusBlock }
			ref={ ref }
		/>
	);
}

export default forwardRef( InserterLibrary );
