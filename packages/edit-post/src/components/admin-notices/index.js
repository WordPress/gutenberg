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
 * Given an admin notice Element, returns the element from which content should
 * be sourced.
 *
 * @param {Element} element Admin notice element.
 *
 * @return {Element} Upgraded notice HTML.
 */
function getNoticeContentSourceFromElement( element ) {
	if ( element.firstElementChild && element.firstElementChild.nodeName === 'P' ) {
		return element.firstElementChild;
	}

	return element;
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
	const contentSource = getNoticeContentSourceFromElement( element );
	const __unstableHTML = contentSource.innerHTML.trim();
	const content = contentSource.textContent.trim();
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
