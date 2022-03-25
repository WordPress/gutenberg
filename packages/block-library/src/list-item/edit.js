/**
 * External dependencies
 */
import { get, first } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { isRTL, __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect, select } from '@wordpress/data';
import { ToolbarButton } from '@wordpress/components';
import {
	formatOutdent,
	formatOutdentRTL,
	formatIndentRTL,
	formatIndent,
} from '@wordpress/icons';

function IdentUI( { attributes, clientId } ) {
	const { canOutdent, blockIndex } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId, getBlockIndex } = innerSelect(
				blockEditorStore
			);
			const grandParentId = getBlockRootClientId(
				getBlockRootClientId( clientId )
			);
			return {
				blockIndex: getBlockIndex( clientId ),
				canOutdent: !! grandParentId,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );
	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				shortcut={ _x( 'Backspace', 'keyboard key' ) }
				disabled={ ! canOutdent }
				onClick={ () => {
					const {
						getBlockRootClientId,
						getBlockAttributes,
						getBlock,
						getBlockIndex,
					} = select( blockEditorStore );
					const listParentId = getBlockRootClientId( clientId );
					const listAttributes = getBlockAttributes( listParentId );
					const listItemParentId = getBlockRootClientId(
						listParentId
					);
					const listItemParentAttributes = getBlockAttributes(
						listItemParentId
					);

					const index = getBlockIndex( clientId );
					const siblingBlocks = getBlock( listParentId ).innerBlocks;

					const newListItemParent = createBlock(
						'core/list-item',
						listItemParentAttributes,
						index === 0
							? []
							: [
									createBlock(
										'core/list',
										listAttributes,
										siblingBlocks.slice( 0, index )
									),
							  ]
					);

					const childList = first( getBlock( clientId ).innerBlocks );
					const childItems = childList?.innerBlocks || [];
					const hasChildItems = !! childItems.length;

					const newItem = createBlock(
						'core/list-item',
						attributes,
						hasChildItems || index < siblingBlocks.length - 1
							? [
									createBlock(
										'core/list',
										hasChildItems
											? childList.attributes
											: listAttributes,
										[
											...childItems,
											...siblingBlocks.slice( index + 1 ),
										]
									),
							  ]
							: []
					);

					replaceBlocks(
						[ listItemParentId ],
						[ newListItemParent, newItem ]
					);
				} }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent' ) }
				describedBy={ __( 'Indent list item' ) }
				shortcut={ _x( 'Space', 'keyboard key' ) }
				isDisabled={ ! blockIndex }
				onClick={ () => {
					const {
						getBlockRootClientId,
						getBlock,
						getBlockOrder,
					} = select( blockEditorStore );
					const parentId = getBlockRootClientId( clientId );
					const previousSiblingId = getBlockOrder( parentId )[
						blockIndex - 1
					];
					const previousSibling = getBlock( previousSiblingId );
					const previousSiblingChildren =
						first( previousSibling.innerBlocks )?.innerBlocks || [];
					const previousSiblingAttributes = first( previousSibling.innerBlocks )?.attributes || {};
					const block = getBlock( clientId );
					const childItemBlocks =
						first( block.innerBlocks )?.innerBlocks || [];
					// Replace the block previous sibling of the block being indented and the indented block
					// with a new block equal whose attributes are equal to the ones of the previous sibling and
					// whose descendants are the children of the previous sibling, followed by the indented block followed by the children of the indented block.
					replaceBlocks(
						[ previousSiblingId, clientId ],
						[
							createBlock(
								'core/list-item',
								previousSibling.attributes,
								[
									createBlock(
										'core/list',
										previousSiblingAttributes,
										[
											...previousSiblingChildren,
											createBlock(
												'core/list-item',
												block.attributes
											),
											...childItemBlocks,
										]
									),
								]
							),
						]
					);
				} }
			/>
		</>
	);
}

export default function ListItemEdit( {
	name,
	attributes,
	setAttributes,
	mergeBlocks,
	onReplace,
	clientId,
} ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list' ],
	} );

	return (
		<>
			<li { ...innerBlocksProps }>
				<RichText
					identifier="content"
					tagName="div"
					onChange={ ( nextContent ) =>
						setAttributes( { content: nextContent } )
					}
					value={ attributes.content }
					aria-label={ __( 'List text' ) }
					placeholder={ attributes.placeholder || __( 'List' ) }
					onSplit={ ( value ) =>
						createBlock( name, {
							...attributes,
							content: value,
						} )
					}
					onMerge={ mergeBlocks }
					onReplace={ onReplace }
				/>
				{ innerBlocksProps.children }
			</li>
			<BlockControls group="block">
				<IdentUI clientId={ clientId } attributes={ attributes } />
			</BlockControls>
		</>
	);
}
