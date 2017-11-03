/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from '../../post-last-revision/check';
import PostLastRevision from '../../post-last-revision';

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
