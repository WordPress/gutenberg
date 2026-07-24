/**
 * WordPress dependencies
 */
import {
	createBlock,
	getDefaultBlockName,
	cloneBlock,
} from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useOutdentListItem from './use-outdent-list-item';
import { unlock } from '../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

export default function useEnter( clientId ) {
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockAttributes,
		getBlockRootClientId,
		getBlockIndex,
		getBlockName,
	} = useSelect( blockEditorStore );
	const outdentListItem = useOutdentListItem();
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.keyCode !== ENTER ) {
				return;
			}
			const { content } = getBlockAttributes( clientId ) ?? {};
			if ( content?.length ) {
				return;
			}
			event.preventDefault();
			const canOutdent =
				getBlockName(
					getBlockRootClientId( getBlockRootClientId( clientId ) )
				) === 'core/list-item';
			if ( canOutdent ) {
				outdentListItem();
				return;
			}
			// Here we are in top level list so we need to split.
			const topParentListBlock = getBlock(
				getBlockRootClientId( clientId )
			);
			const blockIndex = getBlockIndex( clientId );
			const head = cloneBlock( {
				...topParentListBlock,
				innerBlocks: topParentListBlock.innerBlocks.slice(
					0,
					blockIndex
				),
			} );
			const middle = createBlock( getDefaultBlockName() );
			// Last list item might contain a `list` block innerBlock
			// In that case append remaining innerBlocks blocks.
			const after = [
				...( topParentListBlock.innerBlocks[ blockIndex ]
					.innerBlocks[ 0 ]?.innerBlocks || [] ),
				...topParentListBlock.innerBlocks.slice( blockIndex + 1 ),
			];
			const tail = after.length
				? [
						cloneBlock( {
							...topParentListBlock,
							innerBlocks: after,
						} ),
				  ]
				: [];
			replaceBlocks(
				topParentListBlock.clientId,
				[ head, middle, ...tail ],
				1
			);
			// We manually change the selection here because we are replacing
			// a different block than the selected one.
			selectionChange( middle.clientId );
		}

		// Capture phase so we run before writing-flow's ancestor-bubble
		// keydown handlers that gate on `event.defaultPrevented`.
		return subscribeOwnedListener( element, 'keydown', onKeyDown, true );
	}, [] );
}
