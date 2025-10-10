/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Component that renders the "Edit navigation" button for template parts
 * that contain navigation blocks.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The template part block client ID.
 * @return {JSX.Element|null} The Edit navigation button component or null if not applicable.
 */
function TemplatePartNavigationEditButton( { clientId } ) {
	const { selectBlock, flashBlock } = useDispatch( blockEditorStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const { hasNavigationBlocks, firstNavigationBlockId } = useSelect(
		( select ) => {
			const { getBlocksByName, getBlockParentsByBlockName } =
				select( blockEditorStore );

			// Check for Navigation blocks within this Template Part
			const allNavigationBlocks = getBlocksByName( 'core/navigation' );
			const navigationBlocksInTemplatePart = allNavigationBlocks.filter(
				( blockId ) => {
					// Check if this Navigation block is a descendant of the current Template Part
					const templatePartParents = getBlockParentsByBlockName(
						blockId,
						'core/template-part',
						true
					);
					return templatePartParents.includes( clientId );
				}
			);
			const _hasNavigationBlocks =
				navigationBlocksInTemplatePart.length > 0;
			const _firstNavigationBlockId = _hasNavigationBlocks
				? navigationBlocksInTemplatePart[ 0 ]
				: null;

			return {
				hasNavigationBlocks: _hasNavigationBlocks,
				firstNavigationBlockId: _firstNavigationBlockId,
			};
		},
		[ clientId ]
	);

	const onEditNavigation = useCallback( () => {
		if ( firstNavigationBlockId ) {
			// Select the first Navigation block
			selectBlock( firstNavigationBlockId );

			// Flash the block for 1 second to make it obvious
			flashBlock( firstNavigationBlockId, 500 );

			// Enable the complementary area (inspector)
			enableComplementaryArea( 'core', 'edit-post/block' );
		}
	}, [
		firstNavigationBlockId,
		selectBlock,
		flashBlock,
		enableComplementaryArea,
	] );

	// Only show if template part contains navigation blocks
	if ( ! hasNavigationBlocks ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarButton
				label={ __( 'Edit navigation' ) }
				onClick={ onEditNavigation }
			>
				{ __( 'Edit navigation' ) }
			</ToolbarButton>
		</BlockControls>
	);
}

/**
 * Higher-order component that adds the Edit navigation button to template part blocks.
 */
const withTemplatePartNavigationEditButton = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isTemplatePart = props.name === 'core/template-part';

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && isTemplatePart && (
					<TemplatePartNavigationEditButton
						clientId={ props.clientId }
					/>
				) }
			</>
		);
	},
	'withTemplatePartNavigationEditButton'
);

// Register the filter.
addFilter(
	'editor.BlockEdit',
	'core/editor/with-template-part-navigation-edit-button',
	withTemplatePartNavigationEditButton
);
