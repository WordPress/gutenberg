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
import { isRTL, __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { ToolbarButton } from '@wordpress/components';
import {
	formatOutdent,
	formatOutdentRTL,
	formatIndentRTL,
	formatIndent,
} from '@wordpress/icons';
import { useCallback } from '@wordpress/element';

function createListItem( listItemAttributes, listAttributes, children ) {
	return createBlock(
		'core/list-item',
		listItemAttributes,
		! children || ! children.length
			? []
			: [ createBlock( 'core/list', listAttributes, children ) ]
	);
}

function useIndentListItem( clientId ) {
	const { canIndent } = useSelect(
		( innerSelect ) => {
			const { getBlockIndex } = innerSelect( blockEditorStore );
			return {
				canIndent: getBlockIndex( clientId ) > 0,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlock,
		getBlockOrder,
		getSelectionStart,
		getSelectionEnd,
		getBlockIndex,
	} = useSelect( blockEditorStore );

	return [
		canIndent,
		useCallback( () => {
			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();

			const parentId = getBlockRootClientId( clientId );
			const previousSiblingId = getBlockOrder( parentId )[
				getBlockIndex( clientId ) - 1
			];
			const previousSibling = getBlock( previousSiblingId );
			const previousSiblingChildren =
				first( previousSibling.innerBlocks )?.innerBlocks || [];
			const previousSiblingListAttributes =
				first( previousSibling.innerBlocks )?.attributes || {};
			const block = getBlock( clientId );

			const childListAttributes = first( block.innerBlocks )?.attributes;
			const childItemBlocks =
				first( block.innerBlocks )?.innerBlocks || [];

			const newBlock = createListItem(
				block.attributes,
				childListAttributes,
				childItemBlocks
			);
			// Replace the previous sibling of the block being indented and the indented block,
			// with a new block whose attributes are equal to the ones of the previous sibling and
			// whose descendants are the children of the previous sibling, followed by the indented block.
			replaceBlocks(
				[ previousSiblingId, clientId ],
				[
					createListItem(
						previousSibling.attributes,
						previousSiblingListAttributes,
						[ ...previousSiblingChildren, newBlock ]
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
		}, [ clientId ] ),
	];
}

function useOutdentListItem( clientId ) {
	const { canOutdent } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId } = innerSelect( blockEditorStore );
			const grandParentId = getBlockRootClientId(
				getBlockRootClientId( clientId )
			);
			return {
				canOutdent: !! grandParentId,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockAttributes,
		getBlock,
		getBlockIndex,
		getSelectionStart,
		getSelectionEnd,
	} = useSelect( blockEditorStore );

	return [
		canOutdent,
		useCallback( () => {
			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();

			const listParentId = getBlockRootClientId( clientId );
			const listAttributes = getBlockAttributes( listParentId );
			const listItemParentId = getBlockRootClientId( listParentId );
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

			const block = getBlock( clientId );
			const childList = first( block.innerBlocks );
			const childItems = childList?.innerBlocks || [];
			const hasChildItems = !! childItems.length;

			// Create a new list item block whose attributes are equal to the
			// block being outdent and whose children are the children that it had (if any)
			// followed by the siblings that existed after it.
			const newItem = createListItem(
				block.attributes,
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
		}, [ clientId ] ),
	];
}

function IndentUI( { clientId } ) {
	const [ canIndent, indentListItem ] = useIndentListItem( clientId );
	const [ canOutdent, outdentListItem ] = useOutdentListItem( clientId );

	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				disabled={ ! canOutdent }
				onClick={ outdentListItem }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent' ) }
				describedBy={ __( 'Indent list item' ) }
				isDisabled={ ! canIndent }
				onClick={ indentListItem }
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
				<IndentUI clientId={ clientId } />
			</BlockControls>
		</>
	);
}
