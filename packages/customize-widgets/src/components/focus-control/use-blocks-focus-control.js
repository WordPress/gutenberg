/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getWidgetIdFromBlock } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import { useFocusControl } from '.';

export default function useBlocksFocusControl( blocks ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const [ focusedWidgetIdRef ] = useFocusControl();

	const blocksRef = useRef( blocks );

	useEffect( () => {
		blocksRef.current = blocks;
	}, [ blocks ] );

	useEffect( () => {
		if ( focusedWidgetIdRef.current ) {
			const focusedBlock = blocksRef.current.find(
				( block ) =>
					getWidgetIdFromBlock( block ) === focusedWidgetIdRef.current
			);

			if ( focusedBlock ) {
				selectBlock( focusedBlock.clientId );
				// If the block is already being selected, the DOM node won't
				// get focused again automatically.
				// We select the DOM and focus it manually here.
				const blockNode = document.querySelector(
					`[data-block="${ focusedBlock.clientId }"]`
				);
				blockNode?.focus();
			}
		}
	}, [ focusedWidgetIdRef, selectBlock ] );
}
