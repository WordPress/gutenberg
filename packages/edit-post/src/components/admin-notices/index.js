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
	// The order is reversed to match expectations of rendered order, since a
	// NoticesList is itself rendered in reverse order (newest to oldest).
	return Array.from( document.querySelectorAll( '#wpbody-content > .notice' ) ).reverse();
}

/**
 * Given an admin notice Element, returns the relevant notice content HTML.
 *
 * @param {Element} element Admin notice element.
 *
 * @return {Element} Upgraded notice HTML.
 */
function getNoticeHTML( element ) {
	const fragments = [];

	for ( const child of element.childNodes ) {
		if ( child.nodeType !== window.Node.ELEMENT_NODE ) {
			const value = child.nodeValue.trim();
			if ( value ) {
				fragments.push( child.nodeValue );
			}
		} else if ( ! child.classList.contains( 'notice-dismiss' ) ) {
			fragments.push( child.outerHTML );
		}
	}

	return fragments.join( '' );
}

/**
 * Given an admin notice Element, returns the upgraded status type, or
 * undefined if one cannot be determined (i.e. one is not assigned).
 *
 * @param {Element} element Admin notice element.
 *
 * @return {?string} Upgraded status type.
 */
function getNoticeStatus( element ) {
	for ( const className of element.classList ) {
		if ( NOTICE_CLASS_STATUSES.hasOwnProperty( className ) ) {
			return NOTICE_CLASS_STATUSES[ className ];
		}
	}
}

export class AdminNotices extends Component {
	componentDidMount() {
		this.convertNotices();
	}

	convertNotices() {
		const { createNotice } = this.props;
		getAdminNotices().forEach( ( element ) => {
			// Convert and create.
			const status = getNoticeStatus( element );
			const content = getNoticeHTML( element );
			const isDismissible = element.classList.contains( 'is-dismissible' );
			createNotice( status, content, {
				speak: false,
				__unstableHTML: true,
				isDismissible,
			} );

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
