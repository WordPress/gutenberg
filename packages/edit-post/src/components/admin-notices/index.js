/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Mapping of server-supported notice class names to an equivalent notices
 * module status.
 *
 * @type {Map}
 */
const NOTICE_CLASS_STATUSES = {
	'notice-success': 'success',
	updated: 'success',
	'notice-warning': 'warning',
	'notice-error': 'error',
	error: 'error',
	'notice-info': 'info',
};

/**
 * Returns an array of admin notice Elements.
 *
 * @return {Element[]} Admin notice elements.
 */
function getAdminNotices() {
	return [ ...document.querySelectorAll( '.notice' ) ];
}

/**
 * Given an admin notice Element, returns the relevant notice content HTML.
 *
 * @param {Element} element Admin notice element.
 *
 * @return {Element} Upgraded notice HTML.
 */
function getNoticeHTMLFromElement( element ) {
	return [ ...element.childNodes ].filter( ( child ) => (
		child.nodeType !== window.Node.ELEMENT_NODE ||
		! child.classList.contains( 'notice-dismiss' )
	) ).map( ( child ) => child.outerHTML ).join( '' );
}

/**
 * Given an admin notice Element, returns the upgraded status type, or
 * undefined if one cannot be determined (i.e. one is not assigned).
 *
 * @param {Element} element Admin notice element.
 *
 * @return {?string} Upgraded status type.
 */
function getNoticeStatusFromClassList( element ) {
	for ( const className of element.classList ) {
		if ( NOTICE_CLASS_STATUSES.hasOwnProperty( className ) ) {
			return NOTICE_CLASS_STATUSES[ className ];
		}
	}
}

/**
 * Given an admin notice Element, returns a notices module object.
 *
 * @param {Element} element Admin notice element.
 *
 * @return {WPNotice} Notice object.
 */
function getNoticeFromElement( element ) {
	const status = getNoticeStatusFromClassList( element );
	const content = '';
	const __unstableHTML = getNoticeHTMLFromElement( element );
	const isDismissible = element.classList.contains( 'is-dismissible' );

	return { status, content, __unstableHTML, isDismissible };
}

export class AdminNotices extends Component {
	componentDidMount() {
		this.convertNotices();
	}

	convertNotices() {
		const { createNotice } = this.props;
		getAdminNotices().forEach( ( element ) => {
			// Convert and create.
			const notice = getNoticeFromElement( element );
			createNotice( notice, { speak: false } );

			// Remove (now-redundant) admin notice element.
			element.parentNode.removeChild( element );
		} );
	}

	render() {
		return null;
	}
}

export default withDispatch( ( dispatch ) => {
	const { createNotice } = dispatch( 'core/notices' );

	return { createNotice };
} )( AdminNotices );
