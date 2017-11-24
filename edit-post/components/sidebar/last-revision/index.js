/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { PostLastRevision, PostLastRevisionCheck } from '@wordpress/editor';

function LastRevision() {
	return (
		<PostLastRevisionCheck>
			<PanelBody>
				<PostLastRevision />
			</PanelBody>
		</PostLastRevisionCheck>
	);
}

export default LastRevision;
