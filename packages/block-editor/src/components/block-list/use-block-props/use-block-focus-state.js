/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export function useBlockFocusState( clientId ) {
	const {
		__experimentalSetFocusedBlock: setFocusedBlock,
		__experimentalRemoveFocusedBlock: removeFocusedBlock,
	} = useDispatch( blockEditorStore );

	const onFocus = () => setFocusedBlock( clientId );
	const onBlur = () => removeFocusedBlock( clientId );

	return useRefEffect( ( node ) => {
		node.addEventListener( 'focus', onFocus );
		node.addEventListener( 'blur', onBlur );

		return () => {
			node.removeEventListener( 'focus', onFocus );
			node.removeEventListener( 'blur', onBlur );
		};
	} );
}
