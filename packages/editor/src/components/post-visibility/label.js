/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { VISIBILITY_OPTIONS } from './utils';
import { store as editorStore } from '../../store';

/**
 * Returns the label for the current post visibility setting.
 *
 * @return {string} Post visibility label.
 */
export default function PostVisibilityLabel() {
	return usePostVisibilityLabel();
}

/**
 * Get the label for the current post visibility setting.
 *
 * @return {string} Post visibility label.
 */
export function usePostVisibilityLabel() {
	const visibility = useSelect(
		( select ) => select( editorStore ).getEditedPostVisibility(),
		[]
	);

	return VISIBILITY_OPTIONS.find( ( option ) => option.value === visibility )
		?.label;
}
