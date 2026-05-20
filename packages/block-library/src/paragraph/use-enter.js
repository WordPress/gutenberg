/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	hasBlockSupport,
	createBlock,
	cloneBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export function useOnEnter( props ) {
	const { batch } = useRegistry();
	const { moveBlocksToPosition, replaceBlocks, selectionChange } =
		useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockIndex,
		getBlockOrder,
		getBlockName,
		getBlock,
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
			const wrapperBlockName = getBlockName( wrapperClientId );
			const grandparentClientId = getBlockRootClientId( wrapperClientId );

			if (
				! canInsertBlockType( defaultBlockName, grandparentClientId ) ||
				! canInsertBlockType( wrapperBlockName, grandparentClientId )
			) {
				return;
			}

			event.preventDefault();

			// If it is in the middle, split the block in two.
			const wrapperBlock = getBlock( wrapperClientId );
			const head = cloneBlock( {
				...wrapperBlock,
				innerBlocks: wrapperBlock.innerBlocks.slice( 0, position ),
			} );
			const middle = createBlock( defaultBlockName );
			const tail = cloneBlock( {
				...wrapperBlock,
				innerBlocks: wrapperBlock.innerBlocks.slice( position + 1 ),
			} );

			batch( () => {
				replaceBlocks( wrapperClientId, [ head, middle, tail ] );
				// The selected paragraph is a descendant of the replaced
				// wrapper, so `replaceBlocks` leaves the selection stale.
				// Move it to the new default block explicitly.
				selectionChange( middle.clientId );
			} );
		}

		// Capture phase so we run before writing-flow's ancestor-bubble
		// keydown handlers that gate on `event.defaultPrevented`.
		return subscribeDelegatedListener(
			element,
			'keydown',
			onKeyDown,
			true
		);
	}, [] );
}
