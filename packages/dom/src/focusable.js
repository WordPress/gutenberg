/**
 * References:
 *
 * Focusable:
 *  - https://www.w3.org/TR/html5/editing.html#focus-management
 *
 * Sequential focus navigation:
 *  - https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
 *
 * Disabled elements:
 *  - https://www.w3.org/TR/html5/disabled-elements.html#disabled-elements
 *
 * getClientRects algorithm (requiring layout box):
 *  - https://www.w3.org/TR/cssom-view-1/#extension-to-the-element-interface
 *
 * AREA elements associated with an IMG:
 *  - https://w3c.github.io/html/editing.html#data-model
 */

const SELECTOR = [
	'[tabindex]',
	'a[href]',
	'button:not([disabled])',
	'input:not([type="hidden"]):not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'iframe',
	'object',
	'embed',
	'area[href]',
	'[contenteditable]:not([contenteditable=false])',
].join( ',' );

/**
 * Returns true if the specified element is visible (i.e. neither display: none
 * nor visibility: hidden).
 *
 * @param {HTMLElement} element DOM element to test.
 *
 * @return {boolean} Whether element is visible.
 */
function isVisible( element ) {
	return (
		element.offsetWidth > 0 ||
		element.offsetHeight > 0 ||
		element.getClientRects().length > 0
	);
}

/**
 * Returns true if the specified element should be skipped from focusable elements.
 * For now it rather specific for `iframes` and  if tabindex attribute is set to -1.
 *
 * @param {Element} element DOM element to test.
 *
 * @return {boolean} Whether element should be skipped from focusable elements.
 */
function skipFocus( element ) {
	return (
		element.nodeName.toLowerCase() === 'iframe' &&
		element.getAttribute( 'tabindex' ) === '-1'
	);
}

/**
 * Returns true if the specified area element is a valid focusable element, or
 * false otherwise. Area is only focusable if within a map where a named map
 * referenced by an image somewhere in the document.
 *
 * @param {HTMLAreaElement} element DOM area element to test.
 *
 * @return {boolean} Whether area element is valid for focus.
 */
function isValidFocusableArea( element ) {
	/** @type {HTMLMapElement | null} */
	const map = element.closest( 'map[name]' );
	if ( ! map ) {
		return false;
	}

	/** @type {HTMLImageElement | null} */
	const img = element.ownerDocument.querySelector(
		'img[usemap="#' + map.name + '"]'
	);
	return !! img && isVisible( img );
}

/**
 * Returns all focusable elements within a given context.
 *
 * @param {Element} context Element in which to search.
 *
 * @return {Element[]} Focusable elements.
 */
export function find( context ) {
	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {NodeListOf<HTMLElement>} */
	/* eslint-enable jsdoc/no-undefined-types */
	const elements = context.querySelectorAll( SELECTOR );

	return Array.from( elements ).filter( ( element ) => {
		if ( ! isVisible( element ) || skipFocus( element ) ) {
			return false;
		}

		const { nodeName } = element;
		if ( 'AREA' === nodeName ) {
			return isValidFocusableArea(
				/** @type {HTMLAreaElement} */ ( element )
			);
		}

		return true;
	} );
}
