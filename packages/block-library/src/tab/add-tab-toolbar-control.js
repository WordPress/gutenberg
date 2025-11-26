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
import { useDispatch } from '@wordpress/data';

/**
 * "Add Tab" button in the block toolbar for the tab block.
 * @param {Object} props
 * @param {Object} props.attributes   The block attributes.
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { attributes, tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const { className, fontFamily, fontSize } = attributes;

	const addTab = () => {
		const newTabBlock = createBlock( 'core/tab', {
			className,
			fontFamily,
			fontSize,
		} );
		insertBlock( newTabBlock, undefined, tabsClientId );
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
