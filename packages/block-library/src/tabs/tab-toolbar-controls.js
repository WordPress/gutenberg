/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useTabActions from './use-tab-actions';

/**
 * Toolbar controls for the tabs block: reorder the active tab, plus "Add tab"
 * and "Remove tab" buttons. Adding, removing, and reordering all act on the
 * core/tab-panel blocks; the tab-list items attribute is kept in sync
 * automatically via useTabListItemsSync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function TabToolbarControls( { tabsClientId } ) {
	const { insertTab, removeTab, moveTab } = useTabActions( tabsClientId );
	const { tabCount, activeIndex } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return { tabCount: 0, activeIndex: 0 };
			}
			const { getBlocks, getBlockAttributes } =
				select( blockEditorStore );
			const tabsAttributes = getBlockAttributes( tabsClientId );
			const tabPanels = getBlocks( tabsClientId ).find(
				( block ) => block.name === 'core/tab-panels'
			);
			return {
				tabCount: tabPanels?.innerBlocks.length ?? 0,
				activeIndex:
					tabsAttributes?.editorActiveTabIndex ??
					tabsAttributes?.activeTabIndex ??
					0,
			};
		},
		[ tabsClientId ]
	);

	const isRemoveDisabled = tabCount <= 1;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="wp-block-tabs__mover-button"
					icon={ isRTL() ? chevronRight : chevronLeft }
					label={ __( 'Move tab left' ) }
					onClick={ () => moveTab( -1 ) }
					disabled={ activeIndex <= 0 }
					accessibleWhenDisabled
				/>
				<ToolbarButton
					className="wp-block-tabs__mover-button"
					icon={ isRTL() ? chevronLeft : chevronRight }
					label={ __( 'Move tab right' ) }
					onClick={ () => moveTab( 1 ) }
					disabled={ activeIndex >= tabCount - 1 }
					accessibleWhenDisabled
				/>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ () => insertTab() }
					text={ __( 'Add tab' ) }
				/>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ () => removeTab() }
					text={ __( 'Remove tab' ) }
					disabled={ isRemoveDisabled }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
