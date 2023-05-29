/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';

const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

const NON_CONVERTABLE_BLOCKS = [
	'core/pattern-template-content',
	'core/pattern-template-token',
];

export default function PatternTemplateContentEdit( { clientId } ) {
	useBlockEditingMode( 'disabled' );
	const registry = useRegistry();

	const {
		parentClientId,
		selectedBlockIndex,
		selectedBlockName,
		selectedClientId,
		selectedParentClientId,
		tokenIndex,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockIndex,
				getBlockName,
				getClientIdsOfDescendants,
				getBlockRootClientId,
				getSelectedBlockClientId,
			} = select( blockEditorStore );

			const selectedBlockClientId = getSelectedBlockClientId();

			// Find the index of this block compared to other token blocks.
			const flattenedClientIds = getClientIdsOfDescendants( [
				clientId,
			] );
			const tokenBlocks = getBlocksByClientId(
				flattenedClientIds
			).filter(
				( { name, clientId: childClientId } ) =>
					name === 'core/pattern-template-token' ||
					childClientId === selectedBlockClientId
			);
			const tokenPosition = tokenBlocks.findIndex(
				( { clientId: tokenClientId } ) =>
					tokenClientId === selectedBlockClientId
			);

			return {
				parentClientId: getBlockRootClientId( clientId ),
				selectedBlockIndex: getBlockIndex( selectedBlockClientId ),
				selectedClientId: selectedBlockClientId,
				selectedBlockName: getBlockName( selectedBlockClientId ),
				selectedParentClientId: getBlockRootClientId(
					selectedBlockClientId
				),
				tokenIndex: Math.max( 0, tokenPosition ),
			};
		},
		[ clientId ]
	);

	const { insertBlock, moveBlockToPosition } =
		useDispatch( blockEditorStore );

	const canConvertToToken =
		! NON_CONVERTABLE_BLOCKS.includes( selectedBlockName );

	// Show a 'convert' button on children, but not on this block.
	const controls = canConvertToToken && (
		<BlockControls group="block" __experimentalShareWithChildBlocks>
			<ToolbarButton
				onClick={ () => {
					const token = createBlock( 'core/pattern-template-token' );
					const updateSelection = false;
					registry.batch( () => {
						moveBlockToPosition(
							selectedClientId,
							selectedParentClientId,
							parentClientId,
							tokenIndex + 1
						);
						// TODO - determine if the move was successful before inserting the token.
						insertBlock(
							token,
							selectedBlockIndex,
							selectedParentClientId,
							updateSelection
						);
					} );
				} }
			>
				{ __( 'Convert to placeholder' ) }
			</ToolbarButton>
		</BlockControls>
	);

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	// TODO - render the compiled template.
	return (
		<>
			{ controls }
			<div { ...innerBlocksProps } />
		</>
	);
}

const withEnableTemplateContent = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const mode = useSelect(
			( select ) => {
				// While the pattern template content block itself has blockEditingMode=disabled,
				// the children should still be enabled. Set 'default' for any children.
				if (
					select( blockEditorStore ).getBlockParentsByBlockName(
						props.clientId,
						'core/pattern-template-content'
					).length
				) {
					return 'default';
				}
			},
			[ props.clientId ]
		);
		useBlockEditingMode( mode );
		return <BlockEdit { ...props } />;
	},
	'withBlockEditingMode'
);

addFilter(
	'editor.BlockEdit',
	'core/block-library/pattern-template-content/enable-content-blocks',
	withEnableTemplateContent
);
