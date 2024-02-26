/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';
import PostAuthorForm from './index';
import PostPanelRow from '../post-panel-row';

export function PostAuthor() {
	return (
		<PostAuthorCheck>
			<PostPanelRow className="editor-post-author__panel">
				<PostAuthorForm />
			</PostPanelRow>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
