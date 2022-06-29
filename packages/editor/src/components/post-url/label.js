/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostURLLabel() {
	return useSelect(
		( select ) => select( editorStore ).getCurrentPost().link,
		[]
	);
}
