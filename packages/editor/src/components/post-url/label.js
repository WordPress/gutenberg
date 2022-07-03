/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostURLLabel() {
	const postLink = useSelect(
		( select ) => select( editorStore ).getCurrentPost().link,
		[]
	);
	return filterURLForDisplay( postLink );
}
