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

const noop = () => {};

function InserterLibrary(
	{
		rootClientId,
		clientId,
		isAppender,
		showInserterHelpPanel,
		showMostUsedBlocks = false,
		__experimentalInsertionIndex,
		__experimentalFilterValue,
		__experimentalOnPatternCategorySelection,
		onSelect = noop,
		shouldFocusBlock = false,
	},
	ref
) {
	const { destinationRootClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );
			const _rootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;
			return {
				destinationRootClientId: _rootClientId,
			};
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
			__experimentalOnPatternCategorySelection={
				__experimentalOnPatternCategorySelection
			}
			shouldFocusBlock={ shouldFocusBlock }
			ref={ ref }
		/>
	);
}

export default forwardRef( InserterLibrary );
