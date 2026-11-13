const HIDDEN_CONTENT = '[hidden], [aria-hidden="true"]';

/**
 * Read the rendered description of a legacy HTML notice. Browsers include
 * visible aria-hidden text in innerText, so read around those elements.
 *
 * @param element The rendered notice description.
 */
export default function getHTMLNoticeText( element: HTMLElement ): string {
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
			const childText = getHTMLNoticeText( child );
			const inline =
				! display ||
				display.startsWith( 'inline' ) ||
				display === 'contents';
			text += inline || ! childText ? childText : `\n${ childText }\n`;
		}
	}
	return text;
}
