import { useEffect, useImperativeHandle, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Custom hook that manages the focus behavior of the post title input field.
 *
 * @param {Element} forwardedRef - The forwarded ref for the input field.
 *
 * @return {Object} - The ref object.
 */
export default function usePostTitleFocus( forwardedRef ) {
	const ref = useRef();

	const { requestPostTitleFocus } = unlock( useDispatch( editorStore ) );
	const { isCleanNewPost, isFocusRequested } = useSelect( ( select ) => {
		const { isCleanNewPost: _isCleanNewPost, isPostTitleFocusRequested } =
			unlock( select( editorStore ) );

		return {
			isCleanNewPost: _isCleanNewPost(),
			isFocusRequested: isPostTitleFocusRequested(),
		};
	}, [] );

	useImperativeHandle( forwardedRef, () => ( {
		focus: () => {
			ref?.current?.focus();
		},
	} ) );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		const { defaultView } = ref.current.ownerDocument;
		const { name, parent } = defaultView;
		const ownerDocument =
			name === 'editor-canvas' ? parent.document : defaultView.document;
		const { activeElement, body } = ownerDocument;

		// Only autofocus the title when the post is entirely empty. This should
		// only happen for a new post, which means we focus the title on new
		// post so the author can start typing right away, without needing to
		// click anything.
		if ( isCleanNewPost && ( ! activeElement || body === activeElement ) ) {
			ref.current.focus();
		}
	}, [ isCleanNewPost ] );

	useEffect( () => {
		if ( ! isFocusRequested || ! ref.current ) {
			return;
		}
		ref.current.focus();
		// Clear the request so the focus happens once.
		requestPostTitleFocus( false );
	}, [ isFocusRequested, requestPostTitleFocus ] );

	return { ref };
}
