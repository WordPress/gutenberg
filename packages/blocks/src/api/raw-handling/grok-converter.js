/**
 * Converts Grok AI's proprietary HTML to semantic HTML.
 *
 * Grok AI uses span elements with CSS classes for both structure (headings)
 * and styling (bold, italic) instead of semantic HTML tags. This converter
 * transforms Grok's output to proper semantic HTML.
 *
 * Handles:
 * - Heading spans → <h1>, <h2>, <h3>, etc.
 * - Bold spans → <strong>
 * - Italic spans → <em>
 */

/**
 * Checks if a node has bold font-weight based on Grok's CSS classes.
 *
 * @param {Element} node The node to check.
 * @return {boolean} True if the node has bold styling.
 */
function hasBoldClass( node ) {
	return (
		node.classList?.contains( 'r-1vr29t4' ) || // font-weight: 800.
		node.classList?.contains( 'r-b88u0q' ) || // font-weight: 700.
		node.classList?.contains( 'r-majxgm' ) // font-weight: 500.
	);
}

/**
 * Recursively converts Grok's bold spans to <strong> tags.
 *
 * @param {Node}     node The node to process.
 * @param {Document} doc  The document to create elements in.
 * @return {void}
 */
function convertBoldSpans( node, doc ) {
	if ( ! node || node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	// Process children first (depth-first).
	const children = Array.from( node.childNodes );
	children.forEach( ( child ) => convertBoldSpans( child, doc ) );

	if ( node.nodeName === 'SPAN' && hasBoldClass( node ) ) {
		const strong = doc.createElement( 'STRONG' );

		while ( node.firstChild ) {
			strong.appendChild( node.firstChild );
		}

		node.parentNode.replaceChild( strong, node );
	}
}

/**
 * Converts Grok AI's span-based headings to proper HTML heading elements.
 *
 * Detection criteria:
 * - Span elements with display: block
 * - Font-size classes: r-uho16t (h1), r-1blvdjr (h2), etc.
 * - Font-weight classes: r-1vr29t4 (800), r-b88u0q (700)
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
function convertHeadings( node ) {
	if ( node.nodeType !== node.ELEMENT_NODE || node.nodeName !== 'SPAN' ) {
		return;
	}

	const hasBlockDisplay =
		node.style.display === 'block' ||
		node.classList.contains( 'r-1adg3ll' );

	if ( ! hasBlockDisplay ) {
		return;
	}

	const headingMap = {
		'r-s67bdx': 'H1', // font-size: 48px
		'r-uho16t': 'H1', // font-size: 34px
		'r-1yjpyg1': 'H1', // font-size: 31px
		'r-yy2aun': 'H2', // font-size: 26px
		'r-1blvdjr': 'H2', // font-size: 23px
		'r-adyw6z': 'H3', // font-size: 20px
		'r-1inkyih': 'H4', // font-size: 17px
		'r-a023e6': 'H5', // font-size: 15px
		'r-1b43r93': 'H6', // font-size: 14px
	};

	const hasBoldWeight = hasBoldClass( node );

	let headingLevel = null;
	for ( const [ className, level ] of Object.entries( headingMap ) ) {
		if ( node.classList.contains( className ) ) {
			headingLevel = level;
			break;
		}
	}

	// Convert to heading only if we have BOTH heading size AND bold weight.
	if ( headingLevel && hasBoldWeight ) {
		const heading = node.ownerDocument.createElement( headingLevel );

		while ( node.firstChild ) {
			heading.appendChild( node.firstChild );
		}

		convertBoldSpans( heading, node.ownerDocument );

		node.parentNode.replaceChild( heading, node );
	}
}

/**
 * Converts Grok AI's inline formatting spans to semantic HTML tags.
 *
 * Handles:
 * - Bold text (r-b88u0q, r-1vr29t4) → <strong>
 * - Italic text (r-36ujnk) → <em>
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
function convertInlineFormatting( node ) {
	if ( node.nodeType !== node.ELEMENT_NODE || node.nodeName !== 'SPAN' ) {
		return;
	}

	const doc = node.ownerDocument;
	let replacementTag = null;

	// Check for bold (font-weight: 700 or 800).
	if ( hasBoldClass( node ) ) {
		replacementTag = 'STRONG';
	}
	// Check for italic (font-style: italic).
	else if ( node.classList.contains( 'r-36ujnk' ) ) {
		replacementTag = 'EM';
	}

	if ( replacementTag ) {
		const newElement = doc.createElement( replacementTag );

		// Copy all attributes except class and style.
		Array.from( node.attributes ).forEach( ( attr ) => {
			if ( attr.name !== 'class' && attr.name !== 'style' ) {
				newElement.setAttribute( attr.name, attr.value );
			}
		} );

		while ( node.firstChild ) {
			newElement.appendChild( node.firstChild );
		}

		node.parentNode.replaceChild( newElement, node );
	}
}

/**
 * Converts Grok AI's proprietary HTML to semantic HTML.
 *
 * This is the main converter function that handles all Grok transformations:
 * - Block-level: Converts heading spans to <h1>, <h2>, etc.
 * - Inline-level: Converts bold/italic spans to <strong>, <em>
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
export default function grokConverter( node ) {
	convertHeadings( node );

	// Note: convertHeadings replaces the node if it's a heading, so this will only run for non-heading spans.
	if ( node.parentNode ) {
		convertInlineFormatting( node );
	}
}
