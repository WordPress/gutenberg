/**
 * WordPress dependencies
 */
import {
	createBlock,
	getDefaultBlockName,
	cloneBlock,
} from '@wordpress/blocks';
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useIndentListItem from './use-indent-list-item';

export default function useEnter( props ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockRootClientId,
		getBlockParents,
		getBlockIndex,
	} = useSelect( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	const [ canIndent, indentListItem ] = useIndentListItem(
		propsRef.current.clientId
	);
	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				if ( event.defaultPrevented || event.keyCode !== ENTER ) {
					return;
				}
				const { content, clientId } = propsRef.current;
				if ( content.length ) {
					return;
				}
				event.preventDefault();
				if ( canIndent ) {
					indentListItem();
					return;
				}
				// Here we are in top level list so we need to split.
				const blockRootClientId = getBlockRootClientId( clientId );
				const blockParents = getBlockParents( clientId );
				const topParentListBlockClientId = blockParents[ 0 ];
				const topParentListBlock = getBlock(
					topParentListBlockClientId
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
					blockRootClientId,
					[ head, middle, ...tail ],
					1,
					0
				);
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ canIndent ]
	);
}
