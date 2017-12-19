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

export default connect(
	( state ) => ( {
		notices: getNotices( state ),
	} ),
	{ onRemove: removeNotice }
)( NoticeList );
