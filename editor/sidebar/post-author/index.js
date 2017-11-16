/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostAuthor as PostAuthorForm, PostAuthorCheck } from '../../components';

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
