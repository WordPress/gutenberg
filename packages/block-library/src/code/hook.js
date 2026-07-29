/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Custom hook for handling tab indentation in code blocks
 * @return {Object} ref - Ref to attach to the element that should handle tab indentation
 */
export function useTabIndentation() {
	const ref = useRefEffect( ( element ) => {
		function handleKeyDown( event ) {
			if ( event.key !== 'Tab' ) {
				return;
			}

			const ownerDocument = element.ownerDocument;
			const selection = ownerDocument.defaultView.getSelection();

			if ( selection.rangeCount === 0 ) {
				return;
			}

			const range = selection.getRangeAt( 0 );

			if ( range.collapsed ) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			const selectedText = getTextWithLineBreaks( range );
			const modifiedText = event.shiftKey
				? removeIndentation( selectedText )
				: addIndentation( selectedText );

			replaceSelectedText( range, modifiedText, ownerDocument );
		}

		function getTextWithLineBreaks( range ) {
			const fragment = range.cloneContents();
			const tempDiv = document.createElement( 'div' );
			tempDiv.appendChild( fragment );

			tempDiv.querySelectorAll( 'br, div, p, li' ).forEach( ( el ) => {
				el.insertAdjacentText( 'beforebegin', '\n' );
			} );

			return tempDiv.textContent.replace( /\n$/, '' );
		}

		function removeIndentation( text ) {
			return text
				.split( '\n' )
				.map( ( line ) => {
					if ( line.startsWith( '\t' ) ) {
						return line.substring( 1 );
					}
					return line;
				} )
				.join( '\n' );
		}

		function addIndentation( text ) {
			return text
				.split( '\n' )
				.map( ( line ) => ( line.length > 0 ? '\t' + line : line ) )
				.join( '\n' );
		}

		function replaceSelectedText( range, text, ownerDocument ) {
			range.deleteContents();
			const textNode = ownerDocument.createTextNode( text );
			range.insertNode( textNode );

			const newRange = ownerDocument.createRange();
			newRange.selectNode( textNode );

			const selection = ownerDocument.defaultView.getSelection();
			selection.removeAllRanges();
			selection.addRange( newRange );
		}

		element.addEventListener( 'keydown', handleKeyDown );

		return () => {
			element.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [] );

	return ref;
}
