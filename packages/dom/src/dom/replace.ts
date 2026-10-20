import { assertIsDefined } from '../utils/assert-is-defined';
import insertAfter from './insert-after';
import remove from './remove';

/**
 * Given two DOM nodes, replaces the former with the latter in the DOM.
 *
 * @param processedNode Node to be removed.
 * @param newNode       Node to be inserted in its place.
 */
export default function replace(
	processedNode: Element,
	newNode: Element
): void {
	assertIsDefined( processedNode.parentNode, 'processedNode.parentNode' );
	insertAfter( newNode, processedNode.parentNode );
	remove( processedNode );
}
