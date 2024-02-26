/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	hasBlockSupport,
	createBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';

export function useOnEnter( props ) {
	const { batch } = useRegistry();
	const {
		moveBlocksToPosition,
		replaceInnerBlocks,
		duplicateBlocks,
		insertBlock,
	} = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockIndex,
		getBlockOrder,
		getBlockName,
		getBlock,
		getNextBlockClientId,
		canInsertBlockType,
	} = useSelect( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode !== ENTER ) {
				return;
			}

			const { content, clientId } = propsRef.current;

			// The paragraph should be empty.
			if ( content.length ) {
				return;
			}

			const wrapperClientId = getBlockRootClientId( clientId );

			if (
				! hasBlockSupport(
					getBlockName( wrapperClientId ),
					'__experimentalOnEnter',
					false
				)
			) {
				return;
			}

			const order = getBlockOrder( wrapperClientId );
			const position = order.indexOf( clientId );

			// If it is the last block, exit.
			if ( position === order.length - 1 ) {
				let newWrapperClientId = wrapperClientId;

				while (
					! canInsertBlockType(
						getBlockName( clientId ),
						getBlockRootClientId( newWrapperClientId )
					)
				) {
					newWrapperClientId =
						getBlockRootClientId( newWrapperClientId );
				}

				if ( typeof newWrapperClientId === 'string' ) {
					event.preventDefault();
					moveBlocksToPosition(
						[ clientId ],
						wrapperClientId,
						getBlockRootClientId( newWrapperClientId ),
						getBlockIndex( newWrapperClientId ) + 1
					);
				}
				return;
			}

			const defaultBlockName = getDefaultBlockName();

			if (
				! canInsertBlockType(
					defaultBlockName,
					getBlockRootClientId( wrapperClientId )
				)
			) {
				return;
			}

			event.preventDefault();

			// If it is in the middle, split the block in two.
			const wrapperBlock = getBlock( wrapperClientId );
			batch( () => {
				duplicateBlocks( [ wrapperClientId ] );
				const blockIndex = getBlockIndex( wrapperClientId );

				replaceInnerBlocks(
					wrapperClientId,
					wrapperBlock.innerBlocks.slice( 0, position )
				);
				replaceInnerBlocks(
					getNextBlockClientId( wrapperClientId ),
					wrapperBlock.innerBlocks.slice( position + 1 )
				);
				insertBlock(
					createBlock( defaultBlockName ),
					blockIndex + 1,
					getBlockRootClientId( wrapperClientId ),
					true
				);
			} );
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
