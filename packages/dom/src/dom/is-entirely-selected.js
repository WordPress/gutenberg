/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';
import isInputOrTextArea from './is-input-or-text-area';

/**
 * Zero width non-breaking space, used as padding in the editable DOM tree when
 * it is empty otherwise.
 */
const ZWNBSP = '\ufeff';

/**
 * Check whether the contents of the element have been entirely selected.
 * Returns true if there is no possibility of selection.
 *
 * @param {HTMLElement} element The element to check.
 *
 * @return {boolean} True if entirely selected, false if not.
 */
export default function isEntirelySelected( element ) {
	if ( isInputOrTextArea( element ) ) {
		return (
			element.selectionStart === 0 &&
			element.value.length === element.selectionEnd
		);
	}

	if ( ! element.isContentEditable ) {
		return true;
	}

	// If the element is effectively empty (contains only the ZWNBSP
	// placeholder or nothing), consider it entirely selected since there's
	// nothing meaningful to select.
	const text = element.textContent || '';
	if ( text === '' || text === ZWNBSP ) {
		return true;
	}

	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	assertIsDefined( defaultView, 'defaultView' );
	const selection = defaultView.getSelection();
	assertIsDefined( selection, 'selection' );
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return true;
	}

	const { startContainer, endContainer, startOffset, endOffset } = range;

	if (
		startContainer === element &&
		endContainer === element &&
		startOffset === 0 &&
		endOffset === element.childNodes.length
	) {
		return true;
	}

	const lastChild = element.lastChild;
	assertIsDefined( lastChild, 'lastChild' );
	const endContainerContentLength =
		endContainer.nodeType === endContainer.TEXT_NODE
			? /** @type {Text} */ ( endContainer ).data.length
			: endContainer.childNodes.length;

	return (
		isDeepChild( startContainer, element, 'firstChild' ) &&
		isDeepChild( endContainer, element, 'lastChild' ) &&
		startOffset === 0 &&
		endOffset === endContainerContentLength
	);
}

/**
 * Check whether the contents of the element have been entirely selected.
 * Returns true if there is no possibility of selection.
 *
 * @param {HTMLElement|Node}         query     The element to check.
 * @param {HTMLElement}              container The container that we suspect "query" may be a first or last child of.
 * @param {"firstChild"|"lastChild"} propName  "firstChild" or "lastChild"
 *
 * @return {boolean} True if query is a deep first/last child of container, false otherwise.
 */
function isDeepChild( query, container, propName ) {
	/** @type {HTMLElement | ChildNode | null} */
	let candidate = container;
	do {
		if ( query === candidate ) {
			return true;
		}
		candidate = candidate[ propName ];
		// There may be empty text nodes between the first/last child, so ignore
		// them.
		while (
			candidate &&
			candidate.nodeType === candidate.TEXT_NODE &&
			candidate.nodeValue === ''
		) {
			candidate =
				candidate[
					propName === 'lastChild' ? 'previousSibling' : 'nextSibling'
				];
		}
	} while ( candidate );
	return false;
}
