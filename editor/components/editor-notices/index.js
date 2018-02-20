/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { removeNotice } from '../../store/actions';
import { getNotices } from '../../store/selectors';
import TemplateNotice from '../template-notice';

function EditorNotices( props ) {
	return (
		<NoticeList { ...props }>
			<TemplateNotice />
		</NoticeList>
	);
}

export default connect(
	( state ) => ( {
		notices: getNotices( state ),
	} ),
	{ onRemove: removeNotice }
)( EditorNotices );
