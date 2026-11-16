import type { ForwardedRef } from 'react';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { PrivateInserterMenu } from './menu';
import { store as blockEditorStore } from '../../store';
import type { InserterLibraryProps } from './types';

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
	}: InserterLibraryProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const { destinationRootClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );
			const _rootClientId =
				rootClientId ||
				// A missing client ID has no root.
				getBlockRootClientId( clientId as string ) ||
				undefined;
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

function PublicInserterLibrary(
	props: Omit< InserterLibraryProps, 'onPatternCategorySelection' >,
	ref: ForwardedRef< HTMLDivElement >
) {
	return (
		<PrivateInserterLibrary
			{ ...props }
			onPatternCategorySelection={ undefined }
			ref={ ref }
		/>
	);
}

export default forwardRef( PublicInserterLibrary );
