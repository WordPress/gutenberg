/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to choose a block' ),
		},
	],
];

export default function Edit( { clientId, isSelected } ) {
	const {
		activeTabIndex,
		editorActiveTabIndex,
		blockIndex,
		hasInnerBlocksSelected,
		tabsClientId,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockIndex,
				hasSelectedInnerBlock,
				getBlockAttributes,
			} = select( blockEditorStore );

			// Get the tab-panel parent first
			const tabPanelsClientId = getBlockRootClientId( clientId );
			// Then get the tabs parent
			const _tabsClientId = getBlockRootClientId( tabPanelsClientId );

			// Read the active tab indices directly from the tabs block.
			const tabsAttributes = getBlockAttributes( _tabsClientId ) ?? {};

			// Get data about this instance of core/tab.
			const _blockIndex = getBlockIndex( clientId );
			const _hasInnerBlocksSelected = hasSelectedInnerBlock(
				clientId,
				true
			);

			return {
				activeTabIndex: tabsAttributes.activeTabIndex,
				editorActiveTabIndex: tabsAttributes.editorActiveTabIndex,
				blockIndex: _blockIndex,
				hasInnerBlocksSelected: _hasInnerBlocksSelected,
				tabsClientId: _tabsClientId,
			};
		},
		[ clientId ]
	);

	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;

	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Sync editorActiveTabIndex when this tab is selected directly
	useEffect( () => {
		// Only update if this tab is selected and not already the active index
		const isTabSelected = isSelected || hasInnerBlocksSelected;
		if (
			isTabSelected &&
			tabsClientId &&
			effectiveActiveIndex !== blockIndex
		) {
			// Mark as non-persistent so it doesn't add to undo history
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: blockIndex,
			} );
		}
	}, [
		isSelected,
		hasInnerBlocksSelected,
		tabsClientId,
		effectiveActiveIndex,
		blockIndex,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Determine if this is the currently active tab (for editor visibility)
	const isActiveTab = effectiveActiveIndex === blockIndex;

	// Determine if this is the default tab (for the "Default Tab" toggle in controls)
	const isDefaultTab = activeTabIndex === blockIndex;

	// Visible when selected, containing the selection, or the active tab.
	const isSelectedTab = isSelected || hasInnerBlocksSelected || isActiveTab;

	const blockProps = useBlockProps( {
		hidden: ! isSelectedTab,
		tabIndex: isSelectedTab ? 0 : -1,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return (
		<section { ...innerBlocksProps }>
			<Controls
				tabsClientId={ tabsClientId }
				blockIndex={ blockIndex }
				isDefaultTab={ isDefaultTab }
			/>
			{ isSelectedTab && innerBlocksProps.children }
		</section>
	);
}
