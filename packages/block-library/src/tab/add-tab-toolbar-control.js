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
export default function AddTabToolbarControl( { attributes, tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	// Find the tab-panels block within the tabs block
	const tabPanelsClientId = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return null;
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			return tabPanels?.clientId || null;
		},
		[ tabsClientId ]
	);

	const { className, fontFamily, fontSize } = attributes;

	const addTab = () => {
		if ( ! tabPanelsClientId ) {
			return;
		}
		const newTabBlock = createBlock( 'core/tab', {
			className,
			fontFamily,
			fontSize,
		} );
		insertBlock( newTabBlock, undefined, tabPanelsClientId );
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
