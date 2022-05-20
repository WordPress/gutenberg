/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { visibilityOptions } from './utils';
import { store as editorStore } from '../../store';

export default function PostVisibilityLabel() {
	const visibility = useSelect( ( select ) =>
		select( editorStore ).getEditedPostVisibility()
	);
	return visibilityOptions[ visibility ]?.label;
}
