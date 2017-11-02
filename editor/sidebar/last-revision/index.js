/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { IconButton, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
} from '../../selectors';
import { getWPAdminURL } from '../../utils/url';

function LastRevision( { lastRevisionId, revisionsCount } ) {
	if ( ! lastRevisionId ) {
		return null;
	}

	return (
		<PanelBody>
			<IconButton
				href={ getWPAdminURL( 'revision.php', { revision: lastRevisionId } ) }
				className="editor-last-revision__title"
				icon="backup"
			>
				{
					sprintf(
						_n( '%d Revision', '%d Revisions', revisionsCount ),
						revisionsCount
					)
				}
			</IconButton>
		</PanelBody>
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
