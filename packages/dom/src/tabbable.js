/**
 * Internal dependencies
 */
import { find as findFocusable } from './focusable';

/**
 * Returns the tab index of the given element. In contrast with the tabIndex
 * property, this normalizes the default (0) to avoid browser inconsistencies,
 * operating under the assumption that this function is only ever called with a
 * focusable node.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1190261
 *
 * @param {Element} element Element from which to retrieve.
 *
 * @return {number} Tab index of element (default 0).
 */
function getTabIndex( element ) {
	const tabIndex = element.getAttribute( 'tabindex' );
	return tabIndex === null ? 0 : parseInt( tabIndex, 10 );
}

/**
 * Returns true if the specified element is tabbable, or false otherwise.
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element is tabbable.
 */
export function isTabbableIndex( element ) {
	return getTabIndex( element ) !== -1;
}

/** @typedef {HTMLElement & { type?: string, checked?: boolean, name?: string }} MaybeHTMLInputElement */

/**
 * Returns a stateful reducer function which constructs a filtered array of
 * tabbable elements, where at most one radio input is selected for a given
 * name, giving priority to checked input, falling back to the first
 * encountered.
 *
 * @return {(acc: MaybeHTMLInputElement[], el: MaybeHTMLInputElement) => MaybeHTMLInputElement[]} Radio group collapse reducer.
 */
function createStatefulCollapseRadioGroup() {
	/** @type {Record<string, MaybeHTMLInputElement>} */
	const CHOSEN_RADIO_BY_NAME = {};

	return function collapseRadioGroup(
		/** @type {MaybeHTMLInputElement[]} */ result,
		/** @type {MaybeHTMLInputElement} */ element
	) {
		const { nodeName, type, checked, name } = element;

		// For all non-radio tabbables, construct to array by concatenating.
		if ( nodeName !== 'INPUT' || type !== 'radio' || ! name ) {
			return result.concat( element );
		}

		const hasChosen = CHOSEN_RADIO_BY_NAME.hasOwnProperty( name );

		// Omit by skipping concatenation if the radio element is not chosen.
		const isChosen = checked || ! hasChosen;
		if ( ! isChosen ) {
			return result;
		}

		// At this point, if there had been a chosen element, the current
		// element is checked and should take priority. Retroactively remove
		// the element which had previously been considered the chosen one.
		if ( hasChosen ) {
			const hadChosenElement = CHOSEN_RADIO_BY_NAME[ name ];
			result = result.filter( ( e ) => e !== hadChosenElement );
		}

		CHOSEN_RADIO_BY_NAME[ name ] = element;

		return result.concat( element );
	};
}

/**
 * An array map callback, returning an object with the element value and its
 * array index location as properties. This is used to emulate a proper stable
 * sort where equal tabIndex should be left in order of their occurrence in the
 * document.
 *
 * @param {HTMLElement} element Element.
 * @param {number}      index   Array index of element.
 *
 * @return {{ element: HTMLElement, index: number }} Mapped object with element, index.
 */
function mapElementToObjectTabbable( element, index ) {
	return { element, index };
}

/**
 * An array map callback, returning an element of the given mapped object's
 * element value.
 *
 * @param {{ element: HTMLElement }} object Mapped object with element.
 *
 * @return {HTMLElement} Mapped object element.
 */
function mapObjectTabbableToElement( object ) {
	return object.element;
}

/**
 * A sort comparator function used in comparing two objects of mapped elements.
 *
 * @see mapElementToObjectTabbable
 *
 * @param {{ element: HTMLElement, index: number }} a First object to compare.
 * @param {{ element: HTMLElement, index: number }} b Second object to compare.
 *
 * @return {number} Comparator result.
 */
function compareObjectTabbables( a, b ) {
	const aTabIndex = getTabIndex( a.element );
	const bTabIndex = getTabIndex( b.element );

	if ( aTabIndex === bTabIndex ) {
		return a.index - b.index;
	}

	return aTabIndex - bTabIndex;
}

/**
 * Givin focusable elements, filters out tabbable element.
 *
 * @param {HTMLElement[]} focusables Focusable elements to filter.
 *
 * @return {HTMLElement[]} Tabbable elements.
 */
function filterTabbable( focusables ) {
	return focusables
		.filter( isTabbableIndex )
		.map( mapElementToObjectTabbable )
		.sort( compareObjectTabbables )
		.map( mapObjectTabbableToElement )
		.reduce( createStatefulCollapseRadioGroup(), [] );
}

/**
 * @param {Element} context
 * @return {HTMLElement[]} Tabbable elements within the context.
 */
export function find( context ) {
	return filterTabbable( findFocusable( context ) );
}

/**
 * Given a focusable element, find the preceding tabbable element.
 *
 * @param {Element} element The focusable element before which to look. Defaults
 *                          to the active element.
 *
 * @return {HTMLElement|undefined} Preceding tabbable element.
 */
export function findPrevious( element ) {
	return filterTabbable( findFocusable( element.ownerDocument.body ) )
		.reverse()
		.find(
			( focusable ) =>
				// eslint-disable-next-line no-bitwise
				element.compareDocumentPosition( focusable ) &
				element.DOCUMENT_POSITION_PRECEDING
		);
}

/**
 * Given a focusable element, find the next tabbable element.
 *
 * @param {Element} element The focusable element after which to look. Defaults
 *                          to the active element.
 *
 * @return {HTMLElement|undefined} Next tabbable element.
 */
export function findNext( element ) {
	return filterTabbable( findFocusable( element.ownerDocument.body ) ).find(
		( focusable ) =>
			// eslint-disable-next-line no-bitwise
			element.compareDocumentPosition( focusable ) &
			element.DOCUMENT_POSITION_FOLLOWING
	);
}
