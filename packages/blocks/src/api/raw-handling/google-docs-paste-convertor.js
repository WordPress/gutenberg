/* global DOMParser, NodeFilter */

const parser = new DOMParser();

/**
 * Custom filter function to process Google Docs HTML, converting Markdown patterns
 * into semantic HTML while preserving other formatting.
 *
 * @param {string} htmlString The HTML content from the clipboard.
 * @return {string} The processed HTML string with Markdown converted.
 */
export default function googleDocsHtmlMarkdownProcessor( htmlString ) {
	// Detect if it's a Google Docs paste from the HTML string.
	const isGoogleDocsHtml = htmlString.includes(
		'<google-sheets-html-origin>'
	);
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
		// Match Markdown links: [text](url)
		const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

		if ( ! markdownLinkRegex.test( textContent ) ) {
			return;
		}

		markdownLinkRegex.lastIndex = 0;

		const fragment = doc.createDocumentFragment();
		let lastIndex = 0;
		let match;
		let changed = false;

		while ( ( match = markdownLinkRegex.exec( textContent ) ) !== null ) {
			const linkText = match[ 1 ];
			const linkUrl = match[ 2 ];
			const startIndex = match.index;
			const endIndex = markdownLinkRegex.lastIndex;

			if ( startIndex > lastIndex ) {
				fragment.appendChild(
					doc.createTextNode(
						textContent.substring( lastIndex, startIndex )
					)
				);
			}

			const linkElement = doc.createElement( 'a' );
			linkElement.textContent = linkText;
			linkElement.href = linkUrl;
			fragment.appendChild( linkElement );
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

	return body.innerHTML;
}
