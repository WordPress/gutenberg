/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import {
	PostAuthor as PostAuthorForm,
	PostAuthorCheck,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PostAuthor() {
	return (
		<PostAuthorCheck>
			<ToolsPanelItem
				className="edit-post-post-author"
				label={ __( 'Author' ) }
				hasValue={ () => true }
			>
				<PostAuthorForm />
			</ToolsPanelItem>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
