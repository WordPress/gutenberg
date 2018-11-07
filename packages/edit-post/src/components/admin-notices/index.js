/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Set of class name suffixes to associate as the status of an admin notice.
 *
 * @type {Set}
 */
const NOTICE_STATUSES = new Set( [
	'success',
	'warning',
	'error',
	'info',
] );

/**
 * Pattern matching a class list item matching the pattern of an admin notice
 * status class.
 *
 * @type {RegExp}
 */
const REGEXP_NOTICE_STATUS = /^notice-(\w+)$/;

/**
 * Returns an array of admin notice Elements.
 *
 * @return {Element[]} Admin notice elements.
 */
function getAdminNotices() {
	return [ ...document.querySelectorAll( '.notice' ) ];
}

/**
 * Given an admin notice Element, returns the upgraded content string. Prefers
 * text found within its first child paragraph node, but falls back to the text
 * content of the entire notice element.
 *
 * @param {Element} element Admin notice element.
 *
 * @return {string} Upgraded notice content.
 */
function getNoticeContentFromElement( element ) {
	let node = element;
	if ( node.firstElementChild && node.firstElementChild.nodeName === 'P' ) {
		node = node.firstElementChild;
	}

	return node.textContent.trim();
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
		const match = className.match( REGEXP_NOTICE_STATUS );
		if ( match && NOTICE_STATUSES.has( match[ 1 ] ) ) {
			return match[ 1 ];
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
	const content = getNoticeContentFromElement( element );
	const isDismissible = element.classList.contains( 'is-dismissible' );

	return { status, content, isDismissible };
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
			createNotice( notice );

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
