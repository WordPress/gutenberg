import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { useLayoutEffect } from '@wordpress/element';
import { DEFAULT_DEVICE_TYPE } from '../block-editor/viewport';

export function useAdaptEditorToCanvas( canvas ) {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const {
		editPost,
		setDeviceType,
		closePublishSidebar,
		setIsInserterOpened,
	} = useDispatch( editorStore );
	const { getCurrentPost } = useSelect( editorStore );
	const registry = useRegistry();
	useLayoutEffect( () => {
		registry.batch( () => {
			clearSelectedBlock();
			if ( getCurrentPost()?.type ) {
				editPost( { selection: undefined }, { undoIgnore: true } );
			}
			setDeviceType( DEFAULT_DEVICE_TYPE );
			closePublishSidebar();
			setIsInserterOpened( false );
		} );
	}, [
		canvas,
		registry,
		clearSelectedBlock,
		editPost,
		setDeviceType,
		closePublishSidebar,
		setIsInserterOpened,
		getCurrentPost,
	] );
}
