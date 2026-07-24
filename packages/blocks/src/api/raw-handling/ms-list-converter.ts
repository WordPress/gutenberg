/**
 * Internal dependencies
 */
import { deepFilterHTML } from './utils';
import msListIgnore from './ms-list-ignore';

function isList( node: Node ): boolean {
	return node.nodeName === 'OL' || node.nodeName === 'UL';
}

export default function msListConverter( node: Node, doc: Document ): void {
	if ( node.nodeName !== 'P' ) {
		return;
	}

	const element = node as HTMLElement;
	const style = element.getAttribute( 'style' );

	if ( ! style || ! style.includes( 'mso-list' ) ) {
		return;
	}

	const prevNode = element.previousElementSibling;

	// Add new list if no previous.
	if ( ! prevNode || ! isList( prevNode ) ) {
		// See https://html.spec.whatwg.org/multipage/grouping-content.html#attr-ol-type.
		const type = element.textContent!.trim().slice( 0, 1 );
		const isNumeric = /[1iIaA]/.test( type );
		const newListNode = doc.createElement( isNumeric ? 'ol' : 'ul' );

		if ( isNumeric ) {
			newListNode.setAttribute( 'type', type );
		}

		element.parentNode!.insertBefore( newListNode, element );
	}

	const listNode = element.previousElementSibling!;
	const listType = listNode.nodeName;
	const listItem = doc.createElement( 'li' );

	let receivingNode: Node = listNode;

	// Add content.
	listItem.innerHTML = deepFilterHTML( element.innerHTML, [ msListIgnore ] );

	const matches = /mso-list\s*:[^;]+level([0-9]+)/i.exec( style );
	let level = matches ? parseInt( matches[ 1 ], 10 ) - 1 || 0 : 0;

	// Change pointer depending on indentation level.
	while ( level-- ) {
		receivingNode = receivingNode.lastChild || receivingNode;

		// If it's a list, move pointer to the last item.
		if ( isList( receivingNode ) ) {
			receivingNode = receivingNode.lastChild || receivingNode;
		}
	}

	// Make sure we append to a list.
	if ( ! isList( receivingNode ) ) {
		receivingNode = receivingNode.appendChild(
			doc.createElement( listType )
		);
	}

	// Append the list item to the list.
	receivingNode.appendChild( listItem );

	// Remove the wrapper paragraph.
	element.parentNode!.removeChild( element );
}
