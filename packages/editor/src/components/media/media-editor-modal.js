/**
 * WordPress dependencies
 */
import { privateApis as mediaEditorPrivateApis } from '@wordpress/media-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import usePostFields from '../post-fields';

const { MediaEditorModal } = unlock( mediaEditorPrivateApis );

/**
 * Mounts the MediaEditorModal alongside existing editor modals.
 *
 * Bridges `@wordpress/editor`'s `usePostFields('attachment')` hook
 * into the modal, since `@wordpress/media-editor` cannot depend on
 * `@wordpress/editor`.
 *
 * @return {Element} The MediaEditorModal component wired with attachment fields.
 */
export default function MediaEditorModalMount() {
	const fields = usePostFields( { postType: 'attachment' } );
	return <MediaEditorModal fields={ fields } />;
}
