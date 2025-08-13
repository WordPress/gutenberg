/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__unstableBlockToolbarLastItem as BlockToolbarLastItem,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';

// Target block that should have the Add page button.
const SUPPORTED_BLOCK = 'core/navigation';

/**
 * Component that renders the Add page button for the Navigation block.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @return {JSX.Element|null} The Add page button component or null if not applicable.
 */
function NavigationAddPageButton( { clientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );
	const { getBlockCount } = useSelect( blockEditorStore );

	const onAddPage = useCallback( () => {
		// Get the current number of blocks to insert at the end
		const blockCount = getBlockCount( clientId );

		// Create a new navigation link block (default block)
		const newBlock = createBlock( 'core/navigation-link' );

		// Insert the block at the end of the navigation
		insertBlock( newBlock, blockCount, clientId );
	}, [ clientId, insertBlock, getBlockCount ] );

	// Only show when in contentOnly mode
	// if ( blockEditingMode !== 'contentOnly' ) {
	// 	return null;
	// }

	return (
		<BlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton
					name="add-page"
					icon={ plus }
					title={ __( 'Add page' ) }
					onClick={ onAddPage }
				>
					{ __( 'Add page' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockToolbarLastItem>
	);
}

/**
 * Higher-order component that adds the Add page button to the Navigation block.
 */
const withNavigationAddPageButton = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isSupportedBlock = props.name === SUPPORTED_BLOCK;

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && isSupportedBlock && (
					<NavigationAddPageButton { ...props } />
				) }
			</>
		);
	},
	'withNavigationAddPageButton'
);

// Register the filter.
addFilter(
	'editor.BlockEdit',
	'core/navigation/with-navigation-add-page-button',
	withNavigationAddPageButton
);
