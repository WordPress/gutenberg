/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostLastRevision, PostLastRevisionCheck } from '../../components';

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
