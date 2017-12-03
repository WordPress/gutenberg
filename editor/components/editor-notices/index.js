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
import { removeNotice } from '../../actions';
import { getNotices } from '../../selectors';

export default connect(
	( state ) => ( {
		notices: getNotices( state ),
	} ),
	{ onRemove: removeNotice }
)( NoticeList );
