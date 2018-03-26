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
import TemplateValidationNotice from '../template-validation-notice';

function EditorNotices( props ) {
	return (
		<NoticeList { ...props }>
			<TemplateValidationNotice />
		</NoticeList>
	);
}

export default connect(
	( state ) => ( {
		notices: getNotices( state ),
	} ),
	{ onRemove: removeNotice }
)( EditorNotices );
