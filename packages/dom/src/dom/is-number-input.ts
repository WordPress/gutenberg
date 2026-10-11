import deprecated from '@wordpress/deprecated';
import isHTMLInputElement from './is-html-input-element';

/**
 * Check whether the given element is an input field of type number.
 *
 * @param node The HTML node.
 *
 * @return True if the node is number input.
 */
export default function isNumberInput( node: Node ): node is HTMLInputElement {
	deprecated( 'wp.dom.isNumberInput', {
		since: '6.1',
		version: '6.5',
	} );
	return (
		isHTMLInputElement( node ) &&
		node.type === 'number' &&
		! isNaN( node.valueAsNumber )
	);
}
