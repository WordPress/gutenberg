/**
 * WordPress dependencies
 */
import {
	MediaEditorProvider,
	MediaPreview as BaseMediaPreview,
} from '@wordpress/media-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Media preview component for the editor.
 * Connects the base MediaPreview component to the editor store.
 *
 * @param {Object} props - Additional props to spread on MediaPreview.
 * @return {Element} The MediaPreview component.
 */
export default function MediaPreview( props ) {
	const { media } = useSelect( ( select ) => {
		const currentPost = select( editorStore ).getCurrentPost();
		return {
			media: currentPost,
		};
	}, [] );

	return (
		<MediaEditorProvider value={ media }>
			<BaseMediaPreview { ...props } />
		</MediaEditorProvider>
	);
}
