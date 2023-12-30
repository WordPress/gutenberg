/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

function PostFormatCheck( { children } ) {
	const disablePostFormats = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().disablePostFormats,
		[]
	);

	if ( disablePostFormats ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="post-formats">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default PostFormatCheck;
