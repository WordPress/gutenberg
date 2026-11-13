const HIDDEN_CONTENT = '[hidden], [aria-hidden="true"]';

// Read around aria-hidden descendants, which innerText includes.
function readText( element: HTMLElement ): string {
	if (
		! element.querySelector( HIDDEN_CONTENT ) &&
		element.getClientRects().length > 0 &&
		typeof element.innerText === 'string'
	) {
		return element.innerText;
	}

	const view = element.ownerDocument.defaultView;
	const visibility = view?.getComputedStyle( element ).visibility;
	let text = '';
	for ( const node of element.childNodes ) {
		if ( node.nodeType === Node.TEXT_NODE ) {
			if ( visibility !== 'hidden' && visibility !== 'collapse' ) {
				text += node.textContent ?? '';
			}
		} else if ( node.nodeType === Node.ELEMENT_NODE ) {
			const child = node as HTMLElement;
			const display = view?.getComputedStyle( child ).display;
			if ( child.matches( HIDDEN_CONTENT ) || display === 'none' ) {
				continue;
			}
			if ( child.tagName === 'BR' ) {
				text += '\n';
				continue;
			}
			const childText = readText( child );
			const inline =
				! display ||
				display.startsWith( 'inline' ) ||
				display === 'contents';
			text += inline || ! childText ? childText : `\n${ childText }\n`;
		}
	}
	return text;
}

/**
 * Read a mounted notice title or description for an explicit spoken message.
 * Preserves rendered line breaks, omits hidden descendants, and trims the result.
 * Only the supplied element's contents are read. Ancestor aria-hidden is ignored
 * so an application can prepare a message while a dialog hides its background.
 *
 * @param element The element containing the message, excluding actions and details.
 * @return The text to announce.
 */
export function getAnnouncementText( element: HTMLElement ): string {
	if ( element.matches( HIDDEN_CONTENT ) ) {
		return '';
	}
	const view = element.ownerDocument.defaultView;
	for (
		let current: HTMLElement | null = element;
		current;
		current = current.parentElement
	) {
		if (
			current.hidden ||
			view?.getComputedStyle( current ).display === 'none'
		) {
			return '';
		}
	}
	return readText( element ).trim();
}
