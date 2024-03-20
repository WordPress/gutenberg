/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostLastRevision from './';
import PostLastRevisionCheck from './check';

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
