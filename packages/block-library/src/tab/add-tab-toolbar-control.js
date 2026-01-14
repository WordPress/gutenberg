/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Add Tab" button in the block toolbar for the tab block.
 * Inserts new tabs into the tab-panels block.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	// Find the tab-panels block within the tabs block
	const { tabPanelsClientId, nextTabIndex } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelsClientId: null,
					nextTabIndex: 0,
				};
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			return {
				tabPanelsClientId: tabPanels?.clientId || null,
				nextTabIndex: ( tabPanels?.innerBlocks.length || 0 ) + 1,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelsClientId ) {
			return;
		}
		const newTabBlock = createBlock( 'core/tab', {
			anchor: 'tab-' + nextTabIndex,
			/* translators: %d: tab number */
			label: sprintf( __( 'Tab %d' ), nextTabIndex ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelsClientId );
		// @TODO: Possible select and focus the tabs-menu-item active tab RichText editor?
	};

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Add a new tab' ) }
					onClick={ addTab }
					showTooltip
					text={ __( 'Add Tab' ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
