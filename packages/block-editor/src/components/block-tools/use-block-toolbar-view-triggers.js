import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Switches the block toolbar to the editing tools when the person starts
 * editing the content of the selected block: typing in it, or selecting a
 * range of its text. A newly selected block starts in the block view, so a
 * click shows the block-level actions until one of these happens.
 *
 * Part of the block toolbar views experiment.
 */
export default function useBlockToolbarViewTriggers() {
	const registry = useRegistry();
	const { clientId, isTyping, hasTextSelection } = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			isTyping: _isTyping,
			getSelectionStart,
			getSelectionEnd,
		} = select( blockEditorStore );
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();
		return {
			clientId: getSelectedBlockClientId(),
			isTyping: _isTyping(),
			hasTextSelection:
				!! selectionStart.clientId &&
				selectionStart.clientId === selectionEnd.clientId &&
				selectionStart.attributeKey === selectionEnd.attributeKey &&
				selectionStart.offset !== selectionEnd.offset,
		};
	}, [] );
	const { setBlockToolbarView } = unlock( useDispatch( blockEditorStore ) );

	useEffect( () => {
		if (
			! window.__experimentalBlockToolbarViews ||
			! clientId ||
			( ! isTyping && ! hasTextSelection )
		) {
			return;
		}
		// Read the view here rather than depend on it, so that choosing the
		// block view while text is selected doesn't switch straight back.
		const { getBlockToolbarView } = unlock(
			registry.select( blockEditorStore )
		);
		if ( getBlockToolbarView( clientId ) !== 'content' ) {
			setBlockToolbarView( clientId, 'content' );
		}
	}, [
		registry,
		clientId,
		isTyping,
		hasTextSelection,
		setBlockToolbarView,
	] );
}
