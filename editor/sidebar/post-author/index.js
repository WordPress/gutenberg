/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostAuthorCheck from '../../post-author/check';
import PostAuthorForm from '../../post-author';

export function PostAuthor() {
	return (
		<PostAuthorCheck>
			<PanelRow>
				<PostAuthorForm />
			</PanelRow>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
