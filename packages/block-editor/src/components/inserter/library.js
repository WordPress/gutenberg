/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PrivateInserterMenu } from './menu';
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
		__experimentalInitialTab,
		__experimentalInitialCategory,
		__experimentalFilterValue,
		onPatternCategorySelection,
		onSelect = noop,
		shouldFocusBlock = false,
		onClose,
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
		<PrivateInserterMenu
			onSelect={ onSelect }
			rootClientId={ destinationRootClientId }
			clientId={ clientId }
			isAppender={ isAppender }
			showInserterHelpPanel={ showInserterHelpPanel }
			showMostUsedBlocks={ showMostUsedBlocks }
			__experimentalInsertionIndex={ __experimentalInsertionIndex }
			__experimentalFilterValue={ __experimentalFilterValue }
			onPatternCategorySelection={ onPatternCategorySelection }
			__experimentalInitialTab={ __experimentalInitialTab }
			__experimentalInitialCategory={ __experimentalInitialCategory }
			shouldFocusBlock={ shouldFocusBlock }
			ref={ ref }
			onClose={ onClose }
		/>
	);
}

export const PrivateInserterLibrary = forwardRef( InserterLibrary );

function PublicInserterLibrary( props, ref ) {
	return (
		<PrivateInserterLibrary
			{ ...props }
			onPatternCategorySelection={ undefined }
			ref={ ref }
		/>
	);
}

export default forwardRef( PublicInserterLibrary );
