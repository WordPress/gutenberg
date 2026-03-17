/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { filterURLForDisplay, safeDecodeURIComponent } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Represents a label component for a post URL.
 *
 * @return {React.ReactNode} The PostURLLabel component.
 */
export default function PostURLLabel() {
	return usePostURLLabel();
}

/**
 * Custom hook to get the label for the post URL.
 *
 * @return {string} The filtered and decoded post URL label.
 */
export function usePostURLLabel() {
	const postLink = useSelect(
		( select ) => select( editorStore ).getPermalink(),
		[]
	);
	return filterURLForDisplay( safeDecodeURIComponent( postLink ) );
}
