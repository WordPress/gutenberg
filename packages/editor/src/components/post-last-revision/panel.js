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
 * @return {Component} The component to be rendered.
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
