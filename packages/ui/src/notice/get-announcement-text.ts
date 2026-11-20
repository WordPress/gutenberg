import { getComposedParent } from './get-composed-parent';

const HIDDEN_CONTENT = '[hidden], [aria-hidden="true"]';

// innerText preserves rendered whitespace, but includes aria-hidden descendants.
export function getAnnouncementText( element: HTMLElement ): string {
	const view = element.ownerDocument.defaultView;
	for (
		let current: Element | null = element;
		current;
		current = getComposedParent( current )
	) {
		if (
			view?.getComputedStyle( current ).display === 'none' ||
			( current !== element &&
				current.matches( 'details:not([open])' ) &&
				! current
					.querySelector( ':scope > summary' )
					?.contains( element ) )
		) {
			return '';
		}
	}

	let text = '';
	let pendingBreaks = 0;
	function append( value: string ) {
		if ( value ) {
			text += '\n'.repeat( pendingBreaks ) + value;
			pendingBreaks = 0;
		}
	}

	function read( node: HTMLElement ) {
		const style = view?.getComputedStyle( node );
		if ( node.matches( HIDDEN_CONTENT ) || style?.display === 'none' ) {
			return;
		}

		const visible =
			style?.visibility !== 'hidden' && style?.visibility !== 'collapse';
		if ( node.tagName === 'BR' ) {
			if ( visible ) {
				append( '\n' );
			}
			return;
		}

		// Adjacent blocks share a line break. Paragraphs need two.
		const block =
			style?.display &&
			! style.display.startsWith( 'inline' ) &&
			style.display !== 'contents';
		let breaks = 0;
		if ( visible && block ) {
			breaks = node.tagName === 'P' ? 2 : 1;
		}
		pendingBreaks = Math.max( pendingBreaks, breaks );
		if (
			node.getClientRects().length &&
			typeof node.innerText === 'string' &&
			! node.querySelector( HIDDEN_CONTENT )
		) {
			append( node.innerText );
		} else if ( node.matches( 'details:not([open])' ) ) {
			const summary =
				node.querySelector< HTMLElement >( ':scope > summary' );
			if ( summary ) {
				read( summary );
			}
		} else {
			for ( const child of node.childNodes ) {
				if ( child.nodeType === Node.ELEMENT_NODE ) {
					read( child as HTMLElement );
				} else if ( visible && child.nodeType === Node.TEXT_NODE ) {
					const value = child.textContent ?? '';
					append(
						style?.whiteSpaceCollapse === 'collapse'
							? value.replace( /[\t\n\f\r ]+/g, ' ' )
							: value
					);
				}
			}
		}
		pendingBreaks = Math.max( pendingBreaks, breaks );
	}

	read( element );
	return text.trim();
}
