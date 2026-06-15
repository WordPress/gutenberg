/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { textContentSchema } from '@wordpress/dom';

/**
 * Creates a footnotes block from a DOM element.
 *
 * @param {Element} node The DOM element to transform.
 * @return {Object} The footnotes block.
 */
function createFootnotesBlockFromDOMElement( node ) {
	const listItems = Array.from( node.querySelectorAll( 'li' ) );

	const footnotes = listItems.map( ( li ) => {
		// Extract the footnote content (everything except the back link)
		const backLink = li.querySelector( 'a[href^="#"][href$="-link"]' );
		const content = li.cloneNode( true );

		// Remove the back link to get clean content
		if ( backLink ) {
			backLink.remove();
		}

		// Get the text content, removing any extra whitespace
		const footnoteText = content.textContent.trim();

		// Extract the footnote ID from spans or data attributes
		const footnoteSpan = li.querySelector( 'span[id]' );
		const footnoteId = footnoteSpan ? footnoteSpan.id : null;

		return {
			id: footnoteId,
			content: footnoteText,
		};
	} );

	return createBlock( 'core/footnotes', {
		footnotes,
	} );
}

/**
 * Schema for footnotes content.
 */
function getFootnotesContentSchema() {
	return {
		ol: {
			attributes: [
				'data-type',
				'data-block',
				'id',
				'class',
				'className',
				'tabindex',
				'draggable',
				'role',
				'aria-label',
				'data-title',
			],
			classes: [ '*' ],
			children: {
				li: {
					children: '*',
				},
			},
			'#text': {},
		},
		p: {
			children: {
				sup: {
					attributes: [
						'data-fn',
						'data-rich-text-format-boundary',
						'contenteditable',
					],
					classes: [ 'fn' ],
					children: textContentSchema.sup.children,
				},
				'#text': {},
			},
		},
	};
}

const transforms = {
	from: [
		{
			type: 'raw',
			selector: 'ol.wp-block-footnotes, ol[data-type="core/footnotes"]',
			schema: getFootnotesContentSchema,
			transform: createFootnotesBlockFromDOMElement,
			priority: 9,
		},
	],
};

export default transforms;
