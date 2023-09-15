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
		onSelect = noop,
		shouldFocusBlock = false,
	},
	ref
) {
	const { destinationRootClientId, prioritizePatterns } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getSettings } =
				select( blockEditorStore );

			const _rootClientId =
				rootClientId || getBlockRootClientId( clientId ) || undefined;
			return {
				destinationRootClientId: _rootClientId,
				prioritizePatterns:
					getSettings().__experimentalPreferPatternsOnRoot &&
					! _rootClientId,
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
			shouldFocusBlock={ shouldFocusBlock }
			prioritizePatterns={ prioritizePatterns }
			ref={ ref }
		/>
	);
}

export default forwardRef( InserterLibrary );
