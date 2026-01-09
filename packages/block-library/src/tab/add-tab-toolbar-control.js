/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Add Tab" button in the block toolbar for the tab block.
 * Inserts new tabs into the tab-panels block.
 *
 * @param {Object} props
 * @param {Object} props.attributes   The block attributes.
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const {
		insertBlock,
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Find the tab-panels block and tabs-menu block within the tabs block
	const { tabPanelsClientId, nextTabIndex, tabsMenuClientId } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelsClientId: null,
					nextTabIndex: 0,
					tabsMenuClientId: null,
				};
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);
			return {
				tabPanelsClientId: tabPanels?.clientId || null,
				nextTabIndex: ( tabPanels?.innerBlocks.length || 0 ) + 1,
				tabsMenuClientId: tabsMenu?.clientId || null,
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
		} );
		// Pass false for updateSelection to prevent focusing the newly created tab
		insertBlock( newTabBlock, undefined, tabPanelsClientId, false );

		// Set the new tab as the active editor tab (0-indexed, so nextTabIndex - 1)
		// Mark as non-persistent so it doesn't add to undo history
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: nextTabIndex - 1,
			} );
		}

		// Select the tabs-menu so it can handle label editing
		if ( tabsMenuClientId ) {
			selectBlock( tabsMenuClientId );
		}
	};

	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Add Tab' ) }
					onClick={ addTab }
					showTooltip
					text={ __( 'Add Tab' ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
