/* global DOMParser, NodeFilter */

const parser = new DOMParser();

/**
 * Custom filter function to process Google Docs HTML, converting Markdown patterns
 * into semantic HTML (`<code>`, `<pre>`) while preserving other formatting.
 *
 * @param {string} htmlString The HTML content from the clipboard (from GDocs).
 * @return {string} The processed HTML string with Markdown converted.
 */
export default function googleDocsHtmlMarkdownProcessor( htmlString ) {
	// Detect if it's a Google Docs paste from the HTML string.
	const isGoogleDocsHtml = htmlString.includes( 'docs-internal-guid-' );
	if ( ! isGoogleDocsHtml ) {
		return htmlString;
	}

	const doc = parser.parseFromString( htmlString, 'text/html' );
	const body = doc.body;

	const allTextNodes = [];
	const treeWalker = doc.createTreeWalker(
		body,
		NodeFilter.SHOW_TEXT,
		null,
		false
	);
	let currentNode;
	while ( ( currentNode = treeWalker.nextNode() ) ) {
		allTextNodes.push( currentNode );
	}

	allTextNodes.forEach( ( node ) => {
		const textContent = node.nodeValue;
		const inlineCodeRegex = /`([^`]+)`/g;

		if ( ! inlineCodeRegex.test( textContent ) ) {
			return; // No inline code found in this node.
		}

		inlineCodeRegex.lastIndex = 0;

		const fragment = doc.createDocumentFragment();
		let lastIndex = 0;
		let match;
		let changed = false;

		while ( ( match = inlineCodeRegex.exec( textContent ) ) !== null ) {
			const codeContent = match[ 1 ];
			const startIndex = match.index;
			const endIndex = inlineCodeRegex.lastIndex;

			if ( startIndex > lastIndex ) {
				fragment.appendChild(
					doc.createTextNode(
						textContent.substring( lastIndex, startIndex )
					)
				);
			}

			const codeElement = doc.createElement( 'code' );
			codeElement.textContent = codeContent;
			fragment.appendChild( codeElement );
			changed = true;

			lastIndex = endIndex;
		}

		if ( lastIndex < textContent.length ) {
			fragment.appendChild(
				doc.createTextNode( textContent.substring( lastIndex ) )
			);
		}

		if ( changed ) {
			const parent = node.parentNode;
			if ( parent ) {
				parent.replaceChild( fragment, node );
			}
		}
	} );

	// For Multiline code blocks (```) we need to look for back-ticks at the beginning/end of paragraph nodes.
	const paragraphs = Array.from( body.querySelectorAll( 'p' ) );
	let inCodeBlock = false;
	let codeBlockLines = [];
	let nodesToRemove = [];
	let firstCodeBlockNode = null;

	paragraphs.forEach( ( p ) => {
		const pText = p.textContent.trim();

		if ( pText === '```' ) {
			nodesToRemove.push( p );

			if ( ! inCodeBlock ) {
				inCodeBlock = true;
				firstCodeBlockNode = p;
			} else {
				inCodeBlock = false;

				// Replace the collected nodes with a single <pre><code> block
				if ( firstCodeBlockNode && codeBlockLines.length > 0 ) {
					const pre = doc.createElement( 'pre' );
					const code = doc.createElement( 'code' );
					code.textContent = codeBlockLines.join( '\n' );
					pre.appendChild( code );

					// Replace the first node of the block with the <pre> tag.
					// Then remove all subsequent nodes in the block.
					firstCodeBlockNode.parentNode.replaceChild(
						pre,
						firstCodeBlockNode
					);

					nodesToRemove.forEach( ( node ) => {
						if ( node !== firstCodeBlockNode && node.parentNode ) {
							node.parentNode.removeChild( node );
						}
					} );
				}

				codeBlockLines = [];
				nodesToRemove = [];
				firstCodeBlockNode = null;
			}
		} else if ( inCodeBlock ) {
			codeBlockLines.push( pText );
			nodesToRemove.push( p );
		}
	} );

	return body.innerHTML;
}
