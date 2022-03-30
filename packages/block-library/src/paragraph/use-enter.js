/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { hasBlockSupport } from '@wordpress/blocks';

export function useExitOnEnterAtEnd( props ) {
	const { moveBlocksToPosition } = useDispatch( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockIndex,
		getBlockOrder,
		getBlockName,
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
					'__experimentalExitOnEnterAtEnd',
					false
				)
			) {
				return;
			}

			const order = getBlockOrder( wrapperClientId );

			// It should be the last block.
			if ( order.indexOf( clientId ) !== order.length - 1 ) {
				return;
			}

			event.preventDefault();

			moveBlocksToPosition(
				[ clientId ],
				wrapperClientId,
				getBlockRootClientId( wrapperClientId ),
				getBlockIndex( wrapperClientId ) + 1
			);
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
