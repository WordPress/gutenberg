import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import useTabActions from './use-tab-actions';

/**
 * "Remove tab" button in the block toolbar for the tabs block. Removes a
 * core/tab-panel; tabs are added with the inserter in the block toolbar. The
 * tab-list items attribute is kept in sync automatically via
 * useTabListItemsSync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function TabToolbarControls( { tabsClientId } ) {
	const { removeTab } = useTabActions( tabsClientId );
	const isRemoveDisabled = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return true;
			}
			const tabPanels = select( blockEditorStore )
				.getBlocks( tabsClientId )
				.find( ( block ) => block.name === 'core/tab-panels' );
			return ( tabPanels?.innerBlocks.length ?? 0 ) <= 1;
		},
		[ tabsClientId ]
	);

	return (
		<BlockControls group="other">
			<ToolbarGroup>
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
