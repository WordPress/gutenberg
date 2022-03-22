/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

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

export function splitList( topParentListBlock, blockParents, clientId ) {
	const remainingBlocks = [];
	// We cloneDeep with lodash here because we mutate the top list block
	// and we can't use `cloneBlock` because we need to traverse with
	// specific block clientIds.
	const parentClone = cloneDeep( topParentListBlock );
	let parent = parentClone;
	// We append the clientId because the handling is really similar
	// to the parent blocks.
	const parentIds = [ ...blockParents.slice( 1 ), clientId ];
	parentIds.forEach( ( parentClientId, index ) => {
		const matchIndex = parent.innerBlocks.findIndex(
			( innerBlock ) => innerBlock.clientId === parentClientId
		);
		const matchParent = parent.innerBlocks[ matchIndex ];
		const blocksAfter = parent.innerBlocks.slice( matchIndex + 1 );
		if ( blocksAfter.length ) {
			remainingBlocks.unshift( ...blocksAfter );
		}
		// Last parent item by might be a non empty `list`, so append
		// remaining innerBlocks blocks if any.
		const isLastMatch = parentIds.length === index + 1;
		if (
			isLastMatch &&
			matchParent.innerBlocks?.[ 0 ]?.innerBlocks?.length
		) {
			remainingBlocks.unshift(
				...matchParent.innerBlocks[ 0 ].innerBlocks
			);
		}
		// The last block is the actual empty list item, so don't include it.
		parent.innerBlocks = parent.innerBlocks.slice(
			0,
			isLastMatch ? matchIndex : matchIndex + 1
		);
		parent = matchParent;
	} );
	return { beforeBlock: parentClone, remainingBlocks };
}

export function useEnter( props ) {
	// const { __unstableMarkAutomaticChange } = useDispatch( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { getBlock, getBlockParents, getBlockParentsByBlockName } = useSelect(
		blockEditorStore
	);
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.keyCode !== ENTER ) {
				return;
			}
			const { content, clientId } = propsRef.current;
			if ( content.length ) {
				return;
			}
			event.preventDefault();
			const topParentListBlockClientId = getBlockParentsByBlockName(
				clientId,
				'core/list'
			)[ 0 ];
			const { beforeBlock, remainingBlocks } = splitList(
				getBlock( topParentListBlockClientId ),
				getBlockParents( clientId ),
				clientId
			);
			const extraBlocks = [ createBlock( getDefaultBlockName() ) ];
			if ( remainingBlocks.length ) {
				extraBlocks.push(
					createBlock(
						'core/list',
						{},
						remainingBlocks.map( ( block ) => cloneBlock( block ) )
					)
				);
			}
			replaceBlocks(
				topParentListBlockClientId,
				[ cloneBlock( beforeBlock ), ...extraBlocks ],
				1
			);
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
