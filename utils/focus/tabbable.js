/**
 * Internal dependencies
 */
import { find as findFocusable } from './focusable';

/**
 * Returns true if the specified element is tabbable, or false otherwise.
 *
 * @param  {Element} element Element to test
 * @return {Boolean}         Whether element is tabbable
 */
function isTabbableIndex( element ) {
	return element.tabIndex !== -1;
}

/**
 * An array map callback, returning an object with the element value and its
 * array index location as properties. This is used to emulate a proper stable
 * sort where equal tabIndex should be left in order of their occurrence in the
 * document.
 *
 * @param  {Element} element Element
 * @param  {Number}  index   Array index of element
 * @return {Object}          Mapped object with element, index
 */
function mapElementToObjectTabbable( element, index ) {
	return { element, index };
}

/**
 * An array map callback, returning an element of the given mapped object's
 * element value.
 *
 * @param  {Object}  object Mapped object with index
 * @return {Element}        Mapped object element
 */
function mapObjectTabbableToElement( object ) {
	return object.element;
}

/**
 * A sort comparator function used in comparing two objects of mapped elements.
 *
 * @see mapElementToObjectTabbable
 *
 * @param  {Object} a First object to compare
 * @param  {Object} b Second object to compare
 * @return {Number}   Comparator result
 */
function compareObjectTabbables( a, b ) {
	if ( a.element.tabIndex === b.element.tabIndex ) {
		return a.index - b.index;
	}

	return a.element.tabIndex - b.element.tabIndex;
}

export function find( context ) {
	return findFocusable( context )
		.filter( isTabbableIndex )
		.map( mapElementToObjectTabbable )
		.sort( compareObjectTabbables )
		.map( mapObjectTabbableToElement );
}
