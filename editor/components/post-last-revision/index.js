/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostLastRevisionCheck from './check';
import {
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
} from '../../store/selectors';
import { getWPAdminURL } from '../../utils/url';

function LastRevision( { lastRevisionId, revisionsCount } ) {
	return (
		<PostLastRevisionCheck>
			<IconButton
				href={ getWPAdminURL( 'revision.php', { revision: lastRevisionId, gutenberg: true } ) }
				className="editor-post-last-revision__title"
				icon="backup"
			>
				{
					sprintf(
						_n( '%d Revision', '%d Revisions', revisionsCount ),
						revisionsCount
					)
				}
			</IconButton>
		</PostLastRevisionCheck>
	);
}

export default connect(
	( state ) => {
		return {
			lastRevisionId: getCurrentPostLastRevisionId( state ),
			revisionsCount: getCurrentPostRevisionsCount( state ),
		};
	}
)( LastRevision );
