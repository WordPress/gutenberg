/**
 * WordPress dependencies
 */
import { useEffect, useImperativeHandle, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Custom hook that manages the focus behavior of the post title input field.
 *
 * @param {Element} forwardedRef - The forwarded ref for the input field.
 *
 * @return {Object} - The ref object.
 */
export default function usePostTitleFocus( forwardedRef ) {
	const ref = useRef();

	const { isCleanNewPost } = useSelect( ( select ) => {
		const { isCleanNewPost: _isCleanNewPost } = select( editorStore );

		return {
			isCleanNewPost: _isCleanNewPost(),
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

	return { ref };
}
