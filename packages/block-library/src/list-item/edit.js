/**
 * External dependencies
 */
import { first } from 'lodash';

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

function createListItem( listItemAttributes, listAttributes, children ) {
	return createBlock(
		'core/list-item',
		listItemAttributes,
		! children || ! children.length
			? []
			: [ createBlock( 'core/list', listAttributes, children ) ]
	);
}

function IndentUI( { attributes, clientId } ) {
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
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
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
						getSelectionStart,
						getSelectionEnd,
					} = select( blockEditorStore );
					const selectionStart = getSelectionStart();
					const selectionEnd = getSelectionEnd();

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
					const previousSiblings = siblingBlocks.slice( 0, index );
					const afterSiblings = siblingBlocks.slice( index + 1 );

					// Create a new parent list item block with just the siblings
					// that existed before the child item being outdent.
					const newListItemParent = createListItem(
						listItemParentAttributes,
						listAttributes,
						previousSiblings
					);

					const childList = first( getBlock( clientId ).innerBlocks );
					const childItems = childList?.innerBlocks || [];
					const hasChildItems = !! childItems.length;

					// Create a new list item block whose attributes are equal to the
					// block being outdent and whose children are the children that it had (if any)
					// followed by the siblings that existed after it.
					const newItem = createListItem(
						attributes,
						hasChildItems ? childList.attributes : listAttributes,
						[ ...childItems, ...afterSiblings ]
					);

					// Replace the parent list item block, with a new block containing
					// the previous siblings, followed by another block containing after siblings
					// in relation to the block being outdent.
					replaceBlocks(
						[ listItemParentId ],
						[ newListItemParent, newItem ]
					);


					// Restore the selection state.
					selectionChange(
						newItem.clientId,
						selectionEnd.attributeKey,
						selectionEnd.clientId === selectionStart.clientId
							? selectionStart.offset
							: selectionEnd.offset,
						selectionEnd.offset
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
						getSelectionStart,
						getSelectionEnd,
					} = select( blockEditorStore );

					const selectionStart = getSelectionStart();
					const selectionEnd = getSelectionEnd();

					const parentId = getBlockRootClientId( clientId );
					const previousSiblingId = getBlockOrder( parentId )[
						blockIndex - 1
					];
					const previousSibling = getBlock( previousSiblingId );
					const previousSiblingChildren =
						first( previousSibling.innerBlocks )?.innerBlocks || [];
					const previousSiblingAttributes =
						first( previousSibling.innerBlocks )?.attributes || {};
					const block = getBlock( clientId );
					const childItemBlocks =
						first( block.innerBlocks )?.innerBlocks || [];

					const newBlock = createListItem( block.attributes );
					// Replace the previous sibling of the block being indented and the indented block,
					// with a new block whose attributes are equal to the ones of the previous sibling and
					// whose descendants are the children of the previous sibling, followed by the indented block followed by the children of the indented block.
					replaceBlocks(
						[ previousSiblingId, clientId ],
						[
							createListItem(
								previousSibling.attributes,
								previousSiblingAttributes,
								[
									...previousSiblingChildren,
									newBlock,
									...childItemBlocks,
								]
							),
						]
					);

					// Restore the selection state.
					selectionChange(
						newBlock.clientId,
						selectionEnd.attributeKey,
						selectionEnd.clientId === selectionStart.clientId
							? selectionStart.offset
							: selectionEnd.offset,
						selectionEnd.offset
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
				<IndentUI clientId={ clientId } attributes={ attributes } />
			</BlockControls>
		</>
	);
}
