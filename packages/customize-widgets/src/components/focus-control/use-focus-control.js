/**
 * WordPress dependencies
 */
import { useRef, useEffect, useContext } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { FocusControlContext } from './';
import { getWidgetIdFromBlock } from '../../utils';

export default function useFocusControl( blocks ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const focusedWidgetId = useContext( FocusControlContext );

	const blocksRef = useRef( blocks );

	useEffect( () => {
		blocksRef.current = blocks;
	}, [ blocks ] );

	useEffect( () => {
		if ( focusedWidgetId ) {
			const focusedBlock = blocksRef.current.find(
				( block ) => getWidgetIdFromBlock( block ) === focusedWidgetId
			);

			if ( focusedBlock ) {
				selectBlock( focusedBlock.clientId );
			}
		}
	}, [ focusedWidgetId, blocksRef, selectBlock ] );
}
