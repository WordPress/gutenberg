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
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { useGenerateBlockPath } from '../utils/block-selection-path';

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
 * @return {JSX.Element|null} The Edit navigation button component or null if not applicable.
 */
function TemplatePartNavigationEditButton( { clientId } ) {
	const { selectBlock, flashBlock } = useDispatch( blockEditorStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const generateBlockPath = useGenerateBlockPath();

	const {
		hasNavigationBlocks,
		firstNavigationBlockId,
		isNavigationEditable,
		templatePartSlug,
		templatePartTheme,
		onNavigateToEntityRecord,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				getBlockName,
				getBlockEditingMode,
				getBlockAttributes,
				getSettings,
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

			// Get template part attributes (slug and theme) for building the site editor URL
			const templatePartAttributes = getBlockAttributes( clientId );

			return {
				hasNavigationBlocks: _hasNavigationBlocks,
				firstNavigationBlockId: _firstNavigationBlockId,
				// We can't use the useBlockEditingMode hook here because the current
				// context is the template part, not the navigation block.
				isNavigationEditable:
					getBlockEditingMode( _firstNavigationBlockId ) !==
					'disabled',
				templatePartSlug: templatePartAttributes?.slug,
				templatePartTheme: templatePartAttributes?.theme,
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	const onEditNavigation = useCallback( () => {
		if ( ! firstNavigationBlockId ) {
			return;
		}
		if ( ! isNavigationEditable ) {
			// Transfer the user to the isolated section editor and select the first Navigation block
			if (
				! templatePartSlug ||
				! templatePartTheme ||
				! onNavigateToEntityRecord
			) {
				return;
			}

			// Generate the block path to the first navigation block
			const fullPath = generateBlockPath( firstNavigationBlockId );
			if ( ! fullPath ) {
				return;
			}

			// The path needs to be relative to the template part's content, not the page root
			// Find the template part in the path and remove everything up to and including it
			const templatePartIndex = fullPath.findIndex(
				( step ) => step.blockName === TEMPLATE_PART_BLOCK_NAME
			);

			// Get the path starting from inside the template part
			const destinationBlockPath =
				templatePartIndex !== -1
					? fullPath.slice( templatePartIndex + 1 )
					: fullPath;

			// Don't navigate if we don't have a valid relative path
			if ( ! destinationBlockPath || destinationBlockPath.length === 0 ) {
				return;
			}

			// Navigate to the site editor with the template part and select the navigation block
			const templatePartId = `${ templatePartTheme }//${ templatePartSlug }`;
			onNavigateToEntityRecord( {
				postId: templatePartId,
				postType: 'wp_template_part',
				selectedBlockClientId: clientId, // Save current template part block for back button
				destinationBlockPath, // Select the navigation block at destination
			} );
		} else {
			// Select the first Navigation block
			selectBlock( firstNavigationBlockId );

			// Flash the block for 500ms to make it obvious
			flashBlock( firstNavigationBlockId, 500 );

			// Enable the complementary area (inspector)
			enableComplementaryArea( 'core', BLOCK_INSPECTOR_AREA );
		}
	}, [
		firstNavigationBlockId,
		isNavigationEditable,
		templatePartSlug,
		templatePartTheme,
		onNavigateToEntityRecord,
		generateBlockPath,
		clientId,
		selectBlock,
		flashBlock,
		enableComplementaryArea,
	] );

	// Only show if template part contains navigation blocks and they are editable
	if ( ! hasNavigationBlocks ) {
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
