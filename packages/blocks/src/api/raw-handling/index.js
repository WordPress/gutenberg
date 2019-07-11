/**
 * External dependencies
 */
import { flatMap, filter, compact } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockAttributes, parseWithGrammar } from '../parser';
import normaliseBlocks from './normalise-blocks';
import specialCommentConverter from './special-comment-converter';
import listReducer from './list-reducer';
import blockquoteNormaliser from './blockquote-normaliser';
import figureContentReducer from './figure-content-reducer';
import shortcodeConverter from './shortcode-converter';
import {
	deepFilterHTML,
	getBlockContentSchema,
} from './utils';

export { getPhrasingContentSchema } from './phrasing-content';
export { pasteHandler } from './paste-handler';

/**
 * @callback NodeFilterFunc A function that can mutate a given `ChildNode`.
 * @param {ChildNode} node   Node to be mutated.
 * @param {Document}  doc    The document containing the node.
 * @param {Object}    schema The schema.
 * @return {void} Node is mutated in place and should not be returned.
 */

/**
 * @typedef {import('@wordpress/blocks').BlockInstance<Record<string,any>>} BlockInstance
 */

/**
 * @typedef {import('@wordpress/blocks').TransformRaw<any>} TransformRaw
 */

function getRawTransformations() {
	return /** @type {TransformRaw[]} */ ( filter( getBlockTransforms( 'from' ), { type: 'raw' } ) )
		.map( ( transform ) => {
			return transform.isMatch ? transform : {
				...transform,
				isMatch: ( node ) => transform.selector && node.matches( transform.selector ),
			};
		} );
}

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param {Object}         params               Named parameters.
 * @param {string}         params.html          HTML to convert.
 * @param {TransformRaw[]} params.rawTransforms Transforms that can be used.
 *
 * @return {BlockInstance[]} An array of blocks.
 */
function htmlToBlocks( { html, rawTransforms } ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).map( ( node ) => {
		const rawTransform = findTransform( rawTransforms, ( { isMatch } ) => isMatch( node ) );

		if ( ! rawTransform ) {
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				getBlockAttributes(
					'core/html',
					node.outerHTML
				)
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			return transform( node );
		}

		return createBlock(
			blockName,
			getBlockAttributes(
				blockName,
				node.outerHTML
			)
		);
	} );
}

/**
 * Converts an HTML string to known blocks.
 *
 * @param {Object} options
 * @param {string} options.HTML The HTML to convert.
 *
 * @return {BlockInstance[]} A list of blocks.
 */
export function rawHandler( { HTML = '' } ) {
	// If we detect block delimiters, parse entirely as blocks.
	if ( HTML.indexOf( '<!-- wp:' ) !== -1 ) {
		return parseWithGrammar( HTML );
	}

	// An array of HTML strings and block objects. The blocks replace matched
	// shortcodes.
	const pieces = shortcodeConverter( HTML );
	const rawTransforms = getRawTransformations();
	const blockContentSchema = getBlockContentSchema( rawTransforms );

	return compact( flatMap( pieces, ( piece ) => {
		// Already a block from shortcode.
		if ( typeof piece !== 'string' ) {
			return piece;
		}

		// These filters are essential for some blocks to be able to transform
		// from raw HTML. These filters move around some content or add
		// additional tags, they do not remove any content.
		/** @type {NodeFilterFunc[]} */
		const filters = [
			// Needed to adjust invalid lists.
			listReducer,
			// Needed to create more and nextpage blocks.
			specialCommentConverter,
			// Needed to create media blocks.
			figureContentReducer,
			// Needed to create the quote block, which cannot handle text
			// without wrapper paragraphs.
			blockquoteNormaliser,
		];

		piece = deepFilterHTML( piece, filters, blockContentSchema );
		piece = normaliseBlocks( piece );

		return htmlToBlocks( { html: piece, rawTransforms } );
	} ) );
}
