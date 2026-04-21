/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

/**
 * Component check if there are any post formats.
 *
 * @param {Object}          props          The component props.
 * @param {React.ReactNode} props.children The child elements to render.
 *
 * @return {React.ReactNode} The rendered component or null if post formats are disabled.
 */
export default function PostFormatCheck( { children } ) {
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
