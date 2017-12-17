/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostLastRevision, PostLastRevisionCheck } from '../../../components';

function LastRevision() {
	return (
		<PostLastRevisionCheck>
			<PanelBody className="editor-last-revision__panel">
				<PostLastRevision />
			</PanelBody>
		</PostLastRevisionCheck>
	);
}

export default LastRevision;
