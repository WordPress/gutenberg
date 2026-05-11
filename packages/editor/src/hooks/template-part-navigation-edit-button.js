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
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

// Block name constants
const NAVIGATION_BLOCK_NAME = 'core/navigation';
const TEMPLATE_PART_BLOCK_NAME = 'core/template-part';

// Complementary area identifier for the block inspector
const BLOCK_INSPECTOR_AREA = 'edit-post/block';

/**
 * Component that renders the "Edit navigation" button for template parts
 * that contain navigation blocks.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The template part block client ID.
 * @return {React.JSX.Element} The Edit navigation button component or null if not applicable.
 */
function TemplatePartNavigationEditButton( { clientId } ) {
	const registry = useRegistry();
	const { selectBlock, flashBlock } = useDispatch( blockEditorStore );
	const { requestInspectorTab } = unlock( useDispatch( blockEditorStore ) );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const {
		hasNavigationBlocks,
		firstNavigationBlockId,
		isNavigationEditable,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				getBlockName,
				getBlockEditingMode,
			} = select( blockEditorStore );

			const descendants = getClientIdsOfDescendants( clientId );
			const navigationBlocksInTemplatePart = descendants.filter(
				( blockId ) => getBlockName( blockId ) === NAVIGATION_BLOCK_NAME
			);

			const _hasNavigationBlocks =
				navigationBlocksInTemplatePart.length > 0;
			const _firstNavigationBlockId = _hasNavigationBlocks
				? navigationBlocksInTemplatePart[ 0 ]
				: null;

			return {
				hasNavigationBlocks: _hasNavigationBlocks,
				firstNavigationBlockId: _firstNavigationBlockId,
				// We can't use the useBlockEditingMode hook here because the current
				// context is the template part, not the navigation block.
				isNavigationEditable:
					getBlockEditingMode( _firstNavigationBlockId ) !==
					'disabled',
			};
		},
		[ clientId ]
	);

	const onEditNavigation = useCallback( () => {
		if ( firstNavigationBlockId ) {
			// Batch all dispatches so the request is in the store before
			// InspectorControlsTabs mounts. Without this, the Content tab flashes
			// before animating to List View.
			registry.batch( () => {
				selectBlock( firstNavigationBlockId );
				flashBlock( firstNavigationBlockId, 500 );
				enableComplementaryArea( 'core', BLOCK_INSPECTOR_AREA );
				requestInspectorTab( 'list', {
					openPanel: firstNavigationBlockId,
				} );
			} );
		}
	}, [
		firstNavigationBlockId,
		registry,
		selectBlock,
		flashBlock,
		enableComplementaryArea,
		requestInspectorTab,
	] );

	// Only show if template part contains navigation blocks and they are editable
	if ( ! hasNavigationBlocks || ! isNavigationEditable ) {
		return null;
	}

	return (
		<BlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton
					label={ __( 'Edit navigation' ) }
					onClick={ onEditNavigation }
				>
					{ __( 'Edit navigation' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockToolbarLastItem>
	);
}

/**
 * Higher-order component that adds the Edit navigation button to template part blocks.
 */
const withTemplatePartNavigationEditButton = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isTemplatePart = props.name === TEMPLATE_PART_BLOCK_NAME;

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
