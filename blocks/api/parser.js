/**
 * External dependencies
 */
import * as query from 'hpq';
import { escape, unescape } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockSettings, getUnknownTypeHandler } from './registration';
import { createBlock } from './factory';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} blockSettings Block settings
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, blockSettings ) {
	if ( 'function' === typeof blockSettings.attributes ) {
		return blockSettings.attributes( rawContent );
	} else if ( blockSettings.attributes ) {
		return query.parse( rawContent, blockSettings.attributes );
	}

	return {};
}

/**
 * Returns the block attributes of a registered block node given its settings.
 *
 * @param  {?Object} blockSettings Block settings
 * @param  {string}  rawContent    Raw block content
 * @param  {?Object} attributes    Known block attributes (from delimiters)
 * @return {Object}                All block attributes
 */
export function getBlockAttributes( blockSettings, rawContent, attributes ) {
	// Merge any attributes from comment delimiters with block implementation
	attributes = attributes || {};
	if ( blockSettings ) {
		attributes = {
			...attributes,
			...parseBlockAttributes( rawContent, blockSettings ),
		};
	}

	return attributes;
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param  {?String} blockType  Block type slug
 * @param  {String}  rawContent Raw block content
 * @param  {?Object} attributes Attributes obtained from block delimiters
 * @return {?Object}            An initialized block object (if possible)
 */
export function createBlockWithFallback( blockType, rawContent, attributes ) {
	// Use type from block content, otherwise find unknown handler
	blockType = blockType || getUnknownTypeHandler();

	// Try finding settings for known block type, else again fall back
	let blockSettings = getBlockSettings( blockType );
	if ( ! blockSettings ) {
		blockType = getUnknownTypeHandler();
		blockSettings = getBlockSettings( blockType );
	}

	// Include in set only if settings were determined
	// TODO do we ever expect there to not be an unknown type handler?
	if ( blockSettings ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			blockType,
			getBlockAttributes( blockSettings, rawContent, attributes )
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
		/<!--\s*(\/?)wp:([a-z0-9/-]+)((?:\s+[a-z0-9_-]+:[^\s]+)*)\s*-->/g,
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

	// Create a custom HTML schema
	const schema = new tinymce.html.Schema();
	// Add <wp-block> "tags" to our schema
	schema.addCustomElements( 'wp-block' );
	// Add valid <wp-block> "attributes" also
	schema.addValidElements( 'wp-block[slug|attributes]' );
	// Initialize the parser with our custom schema
	const parser = new tinymce.html.DomParser( { validate: true }, schema );

	// Parse the content into an object tree
	const tree = parser.parse( content );

	// Create a serializer that we will use to pass strings to blocks.
	// TODO: pass parse trees instead, and verify them against the markup
	// shapes that each block can accept.
	const serializer = new tinymce.html.Serializer( { validate: true }, schema );

	// Walk the tree and initialize blocks
	const blocks = [];

	// Store markup we found in between blocks
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
	do {
		if ( currentNode.name === 'wp-block' ) {
			// Set node type to document fragment so that the TinyMCE
			// serializer doesn't output its markup
			currentNode.type = 11;

			// Serialize the content
			const rawContent = serializer.serialize( currentNode );

			// Retrieve the attributes from the <wp-block> tag
			const nodeAttributes = currentNode.attributes.reduce( ( memo, attr ) => {
				memo[ attr.name ] = attr.value;
				return memo;
			}, {} );

			// Retrieve the block attributes from the original delimiters
			const blockAttributes = unescape( nodeAttributes.attributes || '' )
				.split( /\s+/ )
				.reduce( ( memo, attrString ) => {
					const pieces = attrString.match( /^([a-z0-9_-]+):(.*)$/ );
					if ( pieces ) {
						memo[ pieces[ 1 ] ] = pieces[ 2 ];
					}
					return memo;
				}, {} );

			// Try to create the block
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
	} while ( currentNode );

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

export default parseWithTinyMCE;
