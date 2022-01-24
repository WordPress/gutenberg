/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import {
	PostAuthor as PostAuthorForm,
	PostAuthorCheck,
} from '@wordpress/editor';

export function PostAuthor() {
	return (
		<PostAuthorCheck>
			<PanelRow className="edit-post-post-author">
				<PostAuthorForm />
			</PanelRow>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
