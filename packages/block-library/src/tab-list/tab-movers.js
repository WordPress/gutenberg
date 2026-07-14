/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useTabActions from '../tabs/use-tab-actions';

/**
 * Block toolbar buttons that reorder the active tab one position left or right.
 * Reordering acts on the underlying core/tab-panel blocks; the tab-list labels
 * follow their panel automatically via useTabListItemsSync. The buttons are
 * disabled at the first/last position.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function TabMovers( { tabsClientId } ) {
	const { moveTab } = useTabActions( tabsClientId );
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

	return (
		<BlockControls group="parent">
			<ToolbarButton
				className="wp-block-tab-list__mover-button"
				icon={ isRTL() ? chevronRight : chevronLeft }
				label={
					isRTL() ? __( 'Move tab right' ) : __( 'Move tab left' )
				}
				onClick={ () => moveTab( -1 ) }
				disabled={ activeIndex <= 0 }
				accessibleWhenDisabled
			/>
			<ToolbarButton
				className="wp-block-tab-list__mover-button"
				icon={ isRTL() ? chevronLeft : chevronRight }
				label={
					isRTL() ? __( 'Move tab left' ) : __( 'Move tab right' )
				}
				onClick={ () => moveTab( 1 ) }
				disabled={ activeIndex >= tabCount - 1 }
				accessibleWhenDisabled
			/>
		</BlockControls>
	);
}
