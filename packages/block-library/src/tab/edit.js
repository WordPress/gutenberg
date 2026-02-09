/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { useMemo, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';
import slugFromLabel from './slug-from-label';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to choose a block' ),
		},
	],
];

const { cancelAnimationFrame } = window;

export default function Edit( {
	attributes,
	clientId,
	context,
	isSelected,
	setAttributes,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const focusRef = useRef();

	const { anchor, label } = attributes;

	// Consume tab indices from context
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];
	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;

	// Clean up animation frames on unmount.
	useEffect( () => {
		return () => {
			if ( focusRef.current ) {
				cancelAnimationFrame( focusRef.current );
			}
		};
	}, [] );

	const { blockIndex, hasInnerBlocksSelected, tabsClientId } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockIndex,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			// Get the tab-panel parent first
			const tabPanelClientId = getBlockRootClientId( clientId );
			// Then get the tabs parent
			const _tabsClientId = getBlockRootClientId( tabPanelClientId );

			// Get data about this instance of core/tab.
			const _blockIndex = getBlockIndex( clientId );
			const _hasInnerBlocksSelected = hasSelectedInnerBlock(
				clientId,
				true
			);

			return {
				blockIndex: _blockIndex,
				hasInnerBlocksSelected: _hasInnerBlocksSelected,
				tabsClientId: _tabsClientId,
			};
		},
		[ clientId ]
	);

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

	/**
	 * This hook determines if the current tab panel should be visible.
	 * This is true if it is the editor active tab, or if it is selected directly.
	 */
	const isSelectedTab = useMemo( () => {
		// Show if this tab is directly selected or has selected inner blocks
		if ( isSelected || hasInnerBlocksSelected ) {
			return true;
		}
		// Always show the active tab (at effectiveActiveIndex) regardless of other selection state.
		// This ensures the tab panel remains visible when editing labels in tabs-menu.
		if ( isActiveTab ) {
			return true;
		}
		return false;
	}, [ isSelected, hasInnerBlocksSelected, isActiveTab ] );

	// Use a custom anchor, if set. Otherwise fall back to the slug generated from the label text.
	const tabPanelId = useMemo(
		() => anchor || slugFromLabel( label, blockIndex ),
		[ anchor, label, blockIndex ]
	);
	const tabLabelId = useMemo( () => `${ tabPanelId }--tab`, [ tabPanelId ] );

	const blockProps = useBlockProps( {
		hidden: ! isSelectedTab,
		'aria-labelledby': tabLabelId,
		id: tabPanelId,
		role: 'tabpanel',
		tabIndex: isSelectedTab ? 0 : -1,
		className: clsx( 'wp-block-tab__editor-content', layoutClassNames ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return (
		<section { ...innerBlocksProps }>
			<Controls
				attributes={ attributes }
				setAttributes={ setAttributes }
				tabsClientId={ tabsClientId }
				blockIndex={ blockIndex }
				isDefaultTab={ isDefaultTab }
			/>
			{ isSelectedTab && innerBlocksProps.children }
		</section>
	);
}
