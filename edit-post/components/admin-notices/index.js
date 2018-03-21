/**
 * External dependencies
 */
import { isEmpty, intersection } from 'lodash';

/**
 * WordPress Dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Internal Dependencies
 */
// TODO: This may not be right to import from, figure out what is.
import { getWPAdminURL } from '../../../editor/utils/url';

const ADMIN_MESSAGES_NOTICE_ID = 'ADMIN_MESSAGES_NOTICES_ID';

const noticeClassNames = [
	'notice',
	'notice-error',
	'notice-warning',
	'notice-success',
	'notice-info',
	'error',
	'warning',
	'success',
	'info',
	'updated',
	'update-nag',
];

function countNotices( noticeList ) {
	const noticeElements = [ ...noticeList.children ];

	return noticeElements.reduce( ( count, element ) => {
		const classMatches = intersection( element.classList, noticeClassNames );
		return isEmpty( classMatches ) ? count : count + 1;
	}, 0 );
}

class AdminNotices extends Component {
	componentWillMount() {
		const noticeList = document.getElementById( 'admin-notice-list' );
		const noticeCount = countNotices( noticeList );
		const { createNotice } = this.props;

		const msg = sprintf( _n(
			'There is a WordPress notice which needs your attention.',
			'There are %d WordPress notices which need your attention.',
			noticeCount ), noticeCount );

		const content = <p><a href={ getWPAdminURL( 'index.php' ) }>{ msg }</a></p>;

		createNotice(
			content,
			{ id: ADMIN_MESSAGES_NOTICE_ID, spokenMessage: msg }
		);
	}

	render() {
		return null;
	}
}

export default withDispatch( ( dispatch ) => ( {
	createNotice: dispatch( 'core/editor' ).createInfoNotice,
} ) )( AdminNotices );

