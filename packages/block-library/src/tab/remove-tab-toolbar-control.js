/**
 * WordPress dependencies
 */
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Remove Tab" button in the block toolbar for the tab block.
 * Removes the currently active core/tab and its corresponding
 * core/tabs-menu-item, keeping both in sync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function RemoveTabToolbarControl( { tabsClientId } ) {
	const {
		removeBlock,
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const {
		activeTabClientId,
		activeMenuItemClientId,
		tabCount,
		editorActiveTabIndex,
	} = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					activeTabClientId: null,
					activeMenuItemClientId: null,
					tabCount: 0,
					editorActiveTabIndex: 0,
				};
			}
			const { getBlocks, getBlockAttributes } =
				select( blockEditorStore );
			const tabsAttributes = getBlockAttributes( tabsClientId );
			const activeIndex =
				tabsAttributes?.editorActiveTabIndex ??
				tabsAttributes?.activeTabIndex ??
				0;
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);
			const tabs = tabPanel?.innerBlocks || [];
			const menuItems = tabsMenu?.innerBlocks || [];
			const activeTab = tabs[ activeIndex ];
			// Match menu item by anchor (e.g. "tab-1" → "tab-1-button").
			const expectedMenuAnchor = activeTab?.attributes?.anchor
				? `${ activeTab.attributes.anchor }-button`
				: null;
			const activeMenuItem = expectedMenuAnchor
				? menuItems.find(
						( m ) => m.attributes?.anchor === expectedMenuAnchor
				  )
				: menuItems[ activeIndex ];
			return {
				activeTabClientId: activeTab?.clientId || null,
				activeMenuItemClientId: activeMenuItem?.clientId || null,
				tabCount: tabs.length,
				editorActiveTabIndex: activeIndex,
			};
		},
		[ tabsClientId ]
	);

	const removeTab = () => {
		if ( ! activeTabClientId || tabCount <= 1 ) {
			return;
		}

		// Calculate new active index after removal.
		const newActiveIndex =
			editorActiveTabIndex >= tabCount - 1
				? tabCount - 2
				: editorActiveTabIndex;

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newActiveIndex,
		} );

		// Remove the tab content block and the corresponding menu item.
		removeBlock( activeTabClientId, false );
		if ( activeMenuItemClientId ) {
			removeBlock( activeMenuItemClientId, false );
		}

		if ( tabsClientId ) {
			selectBlock( tabsClientId );
		}
	};

	const isDisabled = tabCount <= 1 || ! activeTabClientId;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ removeTab }
					text={ __( 'Remove tab' ) }
					disabled={ isDisabled }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
