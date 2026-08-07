import { useRef, useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { getWidgetIdFromBlock } from '@wordpress/widgets';
import { useFocusControl } from '.';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export default function useBlocksFocusControl( blocks ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const [ focusedWidgetIdRef ] = useFocusControl();
	// The block lives in the canvas, which is a document of its own, so track
	// it by client id instead of querying for it. Requesting focus through an
	// object makes the same block focusable twice in a row.
	const [ focusRequest, setFocusRequest ] = useState( null );
	const focusedBlockElement = useBlockElement( focusRequest?.clientId );

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
				setFocusRequest( { clientId: focusedBlock.clientId } );
			}
		}
	}, [ focusedWidgetIdRef, selectBlock ] );

	useEffect( () => {
		if ( ! focusRequest || ! focusedBlockElement ) {
			return;
		}

		focusedBlockElement.focus();

		const { ownerDocument } = focusedBlockElement;
		const { defaultView } = ownerDocument;
		const canvas = defaultView.frameElement;
		let frameRequest;

		// Focusing the widget in the preview makes the customizer swap its
		// preview frame, which drops focus inside the canvas while the canvas
		// itself keeps it. Claim it back, once.
		function handleBlur() {
			focusedBlockElement.removeEventListener( 'blur', handleBlur );
			frameRequest = defaultView.requestAnimationFrame( () => {
				const outerDocument = canvas?.ownerDocument;

				if (
					ownerDocument.activeElement === ownerDocument.body &&
					( ! outerDocument ||
						outerDocument.activeElement === canvas )
				) {
					focusedBlockElement.focus();
				}
			} );
		}

		focusedBlockElement.addEventListener( 'blur', handleBlur );

		return () => {
			focusedBlockElement.removeEventListener( 'blur', handleBlur );
			defaultView.cancelAnimationFrame( frameRequest );
		};
	}, [ focusRequest, focusedBlockElement ] );
}
