/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { IconButton, PanelBody, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isEditedPostNew,
	getCurrentPostId,
	getCurrentPostType,
	isSavingPost,
} from '../../selectors';
import { getWPAdminURL } from '../../utils/url';

function LastRevision( { revisions } ) {
	const lastRevision = last( revisions.data );
	if ( ! lastRevision ) {
		return null;
	}

	return (
		<PanelBody>
			<IconButton
				href={ getWPAdminURL( 'revision.php', { revision: lastRevision.id } ) }
				className="editor-last-revision__title"
				icon="backup"
			>
				{
					sprintf(
						_n( '%d Revision', '%d Revisions', revisions.data.length ),
						revisions.data.length
					)
				}
			</IconButton>
		</PanelBody>
	);
}

export default flowRight(
	connect(
		( state ) => {
			return {
				isNew: isEditedPostNew( state ),
				postId: getCurrentPostId( state ),
				postType: getCurrentPostType( state ),
				isSaving: isSavingPost( state ),
			};
		}
	),
	withAPIData( ( props, { type } ) => {
		const { postType, postId } = props;
		return {
			revisions: `/wp/v2/${ type( postType ) }/${ postId }/revisions`,
		};
	} )
)( LastRevision );
