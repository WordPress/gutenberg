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
 * "Add tab" button in the block toolbar for the tab block.
 * Inserts a new core/tab into the tab-panel and a new core/tabs-menu-item
 * into the tabs-menu, keeping both in sync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const { tabPanelClientId, tabsMenuClientId, tabCount, existingAnchors } =
		useSelect(
			( select ) => {
				if ( ! tabsClientId ) {
					return {
						tabPanelClientId: null,
						tabsMenuClientId: null,
						existingAnchors: [],
					};
				}
				const { getBlocks } = select( blockEditorStore );
				const innerBlocks = getBlocks( tabsClientId );
				const tabPanel = innerBlocks.find(
					( block ) => block.name === 'core/tab-panel'
				);
				const tabsMenu = innerBlocks.find(
					( block ) => block.name === 'core/tabs-menu'
				);
				return {
					tabPanelClientId: tabPanel?.clientId || null,
					tabsMenuClientId: tabsMenu?.clientId || null,
					tabCount: tabPanel?.innerBlocks?.length || 0,
					existingAnchors: ( tabPanel?.innerBlocks || [] )
						.map( ( block ) => block.attributes.anchor )
						.filter( Boolean ),
				};
			},
			[ tabsClientId ]
		);

	const addTab = () => {
		if ( ! tabPanelClientId ) {
			return;
		}

		// Start from count + 1 so the label stays sequential, then increment
		// until the anchor slot is free.
		const existingAnchorSet = new Set( existingAnchors );
		let tabNumber = tabCount + 1;
		while ( existingAnchorSet.has( `tab-${ tabNumber }` ) ) {
			tabNumber++;
		}

		const newTabBlock = createBlock( 'core/tab', {
			anchor: `tab-${ tabNumber }`,
			/* translators: %d: tab number */
			label: sprintf( __( 'Tab %d' ), tabNumber ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelClientId );

		// Insert a corresponding menu item into the tabs-menu.
		if ( tabsMenuClientId ) {
			const newMenuItemBlock = createBlock( 'core/tabs-menu-item', {
				anchor: `tab-${ tabNumber }-button`,
			} );
			insertBlock( newMenuItemBlock, undefined, tabsMenuClientId );
		}
	};

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ addTab }
					text={ __( 'Add tab' ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
