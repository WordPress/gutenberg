/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { CustomInserterItemsProvider } from './custom-inserter-items-context';
import { store as blockEditorStore } from '../../store';

const noop = () => {};
const EMPTY_ARRAY = [];

function InserterLibrary(
	{
		rootClientId,
		clientId,
		isAppender,
		showInserterHelpPanel,
		showMostUsedBlocks = false,
		__experimentalCustomInserterItems = EMPTY_ARRAY,
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
		<CustomInserterItemsProvider
			value={ __experimentalCustomInserterItems }
		>
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
		</CustomInserterItemsProvider>
	);
}

export default forwardRef( InserterLibrary );
