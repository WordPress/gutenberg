/**
 * External dependencies
 */
import tinymce from 'tinymce';
import { parse as hpqParse } from 'hpq';
import { escape, unescape, pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandler } from './registration';
import { createBlock } from './factory';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} blockType     Block type
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, blockType ) {
	const { attributes } = blockType;
	if ( 'function' === typeof attributes ) {
		return attributes( rawContent );
	} else if ( attributes ) {
		// Matchers are implemented as functions that receive a DOM node from
		// which to select data. Use of the DOM is incidental and we shouldn't
		// guarantee a contract that this be provided, else block implementers
		// may feel compelled to use the node. Instead, matchers are intended
		// as a generic interface to query data from any tree shape. Here we
		// pick only matchers which include an internal flag.
		const knownMatchers = pickBy( attributes, '_wpBlocksKnownMatcher' );

		return hpqParse( rawContent, knownMatchers );
	}

	return {};
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param  {?Object} blockType     Block type
 * @param  {string}  rawContent    Raw block content
 * @param  {?Object} attributes    Known block attributes (from delimiters)
 * @return {Object}                All block attributes
 */
export function getBlockAttributes( blockType, rawContent, attributes ) {
	// Merge any attributes present in comment delimiters with those
	// that are specified in the block implementation.
	attributes = attributes || {};
	if ( blockType ) {
		attributes = {
			...blockType.defaultAttributes,
			...attributes,
			...parseBlockAttributes( rawContent, blockType ),
		};
	}

	return attributes;
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param  {?String} name       Block type slug
 * @param  {String}  rawContent Raw block content
 * @param  {?Object} attributes Attributes obtained from block delimiters
 * @return {?Object}            An initialized block object (if possible)
 */
export function createBlockWithFallback( name, rawContent, attributes ) {
	// Use type from block content, otherwise find unknown handler.
	name = name || getUnknownTypeHandler();

	// Try finding type for known block name, else fall back again.
	let blockType = getBlockType( name );
	const fallbackBlock = getUnknownTypeHandler();
	if ( ! blockType ) {
		name = fallbackBlock;
		blockType = getBlockType( name );
	}

	// Include in set only if type were determined.
	// TODO do we ever expect there to not be an unknown type handler?
	if ( blockType && ( rawContent.trim() || name !== fallbackBlock ) ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			name,
			getBlockAttributes( blockType, rawContent.trim(), attributes )
		);
		return block;
	}
}

/**
 * Parses the post content with TinyMCE and returns a list of blocks.
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export function parseWithTinyMCE( content ) {
	// First, convert comment delimiters into temporary <wp-block> "tags" so
	// that TinyMCE can parse them.  Examples:
	//   In  : <!-- wp:core/text -->
	//   Out : <wp-block slug="core/text">
	//   In  : <!-- /wp:core/text -->
	//   Out : </wp-block>
	//   In  : <!-- wp:core/embed url:youtube.com/xxx& -->
	//   Out : <wp-block slug="core/embed" attributes="url:youtube.com/xxx&amp;">
	content = content.replace(
		/<!--\s*(\/?)wp:([a-z0-9/-]+)((?:\s+[a-z0-9_-]+(="[^"]*")?)*)\s*-->/g,
		function( match, closingSlash, slug, attributes ) {
			if ( closingSlash ) {
				return '</wp-block>';
			}

			if ( attributes ) {
				attributes = ' attributes="' + escape( attributes.trim() ) + '"';
			}
			return '<wp-block slug="' + slug + '"' + attributes + '>';
		}
	);

	// Create a custom HTML schema.
	const schema = new tinymce.html.Schema();

	// Add <wp-block> "tags" to our schema.
	schema.addCustomElements( 'wp-block' );

	// Add valid <wp-block> "attributes" also.
	schema.addValidElements( 'wp-block[slug|attributes]' );

	// Initialize the parser with our custom schema.
	const parser = new tinymce.html.DomParser( { validate: true }, schema );

	// Parse the content into an object tree.
	const tree = parser.parse( content );

	// Create a serializer that we will use to pass strings to blocks.
	// TODO: pass parse trees instead, and verify them against the markup
	// shapes that each block can accept.
	const serializer = new tinymce.html.Serializer( { validate: true }, schema );

	// Walk the tree and initialize blocks.
	const blocks = [];

	// Store markup we found in between blocks.
	let contentBetweenBlocks = null;
	function flushContentBetweenBlocks() {
		if ( contentBetweenBlocks && contentBetweenBlocks.firstChild ) {
			const block = createBlockWithFallback(
				null, // default: unknown type handler
				serializer.serialize( contentBetweenBlocks ),
				null  // no known attributes
			);
			if ( block ) {
				blocks.push( block );
			}
		}
		contentBetweenBlocks = new tinymce.html.Node( 'body', 11 );
	}
	flushContentBetweenBlocks();

	let currentNode = tree.firstChild;
	while ( currentNode ) {
		if ( currentNode.name === 'wp-block' ) {
			// Set node type to document fragment so that the TinyMCE
			// serializer doesn't output its markup.
			currentNode.type = 11;

			// Serialize the content
			const rawContent = serializer.serialize( currentNode );

			// Retrieve the attributes from the <wp-block> tag.
			const nodeAttributes = currentNode.attributes.reduce( ( memo, attr ) => {
				memo[ attr.name ] = attr.value;
				return memo;
			}, {} );

			// Retrieve the block attributes from the original delimiters.
			const attributesMatcher = /([a-z0-9_-]+)(="([^"]*)")?/g;
			const blockAttributes = {};
			let match;
			do {
				match = attributesMatcher.exec( unescape( nodeAttributes.attributes || '' ) );
				if ( match ) {
					blockAttributes[ match[ 1 ] ] = !! match[ 2 ] ? match[ 3 ] : true;
				}
			} while ( !! match );

			// Try to create the block.
			const block = createBlockWithFallback(
				nodeAttributes.slug,
				rawContent,
				blockAttributes
			);
			if ( block ) {
				flushContentBetweenBlocks();
				blocks.push( block );
			}

			currentNode = currentNode.next;
		} else {
			// We have some HTML content outside of block delimiters.  Save it
			// so that we can initialize it using `getUnknownTypeHandler`.
			const toAppend = currentNode;
			// Advance the DOM tree pointer before calling `append` because
			// this is a destructive operation.
			currentNode = currentNode.next;
			contentBetweenBlocks.append( toAppend );
		}
	}

	flushContentBetweenBlocks();

	return blocks;
}

/**
 * Parses the post content with a PegJS grammar and returns a list of blocks.
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export function parseWithGrammar( content ) {
	return grammarParse( content ).reduce( ( memo, blockNode ) => {
		const { blockType, rawContent, attrs } = blockNode;
		const block = createBlockWithFallback( blockType, rawContent, attrs );
		if ( block ) {
			memo.push( block );
		}
		return memo;
	}, [] );
}

export default parseWithGrammar;
