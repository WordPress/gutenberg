/**
 * External dependencies
 */
import { isEmpty, intersection } from 'lodash';

/**
 * WordPress Dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Notice } from '@wordpress/components';

/**
 * Internal Dependencies
 */
// TODO: This may not be right to import from, figure out what is.
import { getWPAdminURL } from '../../../editor/utils/url';

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
	constructor() {
		super( ...arguments );

		this.state = { noticeCount: 0 };
	}

	componentWillMount() {
		const noticeList = document.getElementById( 'admin-notice-list' );
		const noticeCount = countNotices( noticeList );

		this.setState( () => {
			return { noticeCount };
		} );
	}

	render() {
		const { noticeCount } = this.state;

		if ( noticeCount === 0 ) {
			return null;
		}

		const msg = sprintf( _n(
			'There is a WordPress notice which needs your attention.',
			'There are %d WordPress notices which need your attention.',
			noticeCount ), noticeCount );

		const content = <p><a href={ getWPAdminURL( 'index.php' ) }>{ msg }</a></p>;

		return (
			<div className="admin-notices-summary">
				<Notice status="info" content={ content } isDismissible={ false } />
			</div>
		);
	}
}

export default AdminNotices;

