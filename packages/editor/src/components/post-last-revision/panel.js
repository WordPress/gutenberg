/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostLastRevision from './';
import PostLastRevisionCheck from './check';

/**
 * Renders the panel for displaying the last revision of a post.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostLastRevisionPanel() {
	return (
		<PostLastRevisionCheck>
			<PanelBody className="editor-post-last-revision__panel">
				<PostLastRevision />
			</PanelBody>
		</PostLastRevisionCheck>
	);
}

export default PostLastRevisionPanel;
