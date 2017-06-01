/* eslint-disable no-console */

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
import {
	getBlocks,
	getBlockSettings,
	getUnknownTypeHandler,
} from './registration';
import { createBlock } from './factory';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} blockSettings Block settings
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, blockSettings ) {
	const { attributes } = blockSettings;
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
			...blockSettings.defaultAttributes,
			...parseBlockAttributes( rawContent, blockSettings ),
		};
	}

	return attributes;
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param  {?String} blockType     Block type slug
 * @param  {String}  rawContent    Raw block content
 * @param  {?Object} attributes    Attributes obtained from block delimiters
 * @param  {?Object} contentObject Cbject for validating against a schema.
 * @return {?Object}               An initialized block object (if possible)
 */
export function createBlockWithFallback(
	blockType,
	rawContent,
	attributes,
	contentObject
) {
	// Use type from block content, otherwise find unknown handler
	blockType = blockType || getUnknownTypeHandler();

	// Try finding settings for known block type, else again fall back
	let blockSettings = getBlockSettings( blockType );
	const fallbackBlockType = getUnknownTypeHandler();

	// If the block has a schema and we were passed a content tree object,
	// validate the content against the block schema.  Then, if validation
	// fails, ensure that we fall back to the unknown type handler.
	if (
		blockSettings &&
		blockSettings.schema &&
		contentObject &&
		blockSettings.schema.validateFragment( contentObject ) !== true
	) {
		blockSettings = null;
	}

	if ( ! blockSettings ) {
		blockType = fallbackBlockType;
		blockSettings = getBlockSettings( blockType );
	}

	// Include in set only if settings were determined
	// TODO do we ever expect there to not be an unknown type handler?
	if ( blockSettings && ( rawContent.trim() || blockType !== fallbackBlockType ) ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			blockType,
			getBlockAttributes( blockSettings, rawContent.trim(), attributes )
		);
		return block;
	}
}

/**
 * Converts an object tree from the format returned by the TinyMCE parser (with
 * `firstChild` and `lastChild`) into the format expected by `phs` (with
 * `childNodes`).
 *
 * @param  {Object} node A TinyMCE DOM-like node (result of a parse operation).
 * @return {Object}      An object to validate against a `phs` schema.
 */
export function mceNodeToObjectTree( node ) {
	const childNodes = [];
	let child = node.firstChild;
	while ( child ) {
		childNodes.push( mceNodeToObjectTree( child ) );
		child = child.next;
	}
	return {
		// TODO nodeName = '#text', tagName = undefined
		nodeName: node.name,
		tagName: node.name,
		childNodes,
	};
}

/**
 * Parses the post content with TinyMCE and returns a list of blocks.
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export function parseWithTinyMCE( content ) {
	const blocksWithSchemas = getBlocks().filter( block => !! block.schema );

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

	// Create a custom TinyMCE parser schema
	const parserSchema = new tinymce.html.Schema();
	// Add <wp-block> "tags" to our parser schema
	parserSchema.addCustomElements( 'wp-block' );
	// Add valid <wp-block> "attributes" also
	parserSchema.addValidElements( 'wp-block[slug|attributes]' );
	// Initialize the parser with our custom schema
	const parser = new tinymce.html.DomParser( { validate: true }, parserSchema );

	// Parse the content into an object tree
	const tree = parser.parse( content );

	// Create a serializer that we will use to pass strings to blocks.
	// TODO: pass parse trees instead, and verify them against the markup
	// shapes that each block can accept.
	const serializer = new tinymce.html.Serializer( { validate: true }, parserSchema );

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
	while ( currentNode ) {
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
			const attributesMatcher = /([a-z0-9_-]+)(="([^"]*)")?/g;
			const blockAttributes = {};
			let match;
			do {
				match = attributesMatcher.exec( unescape( nodeAttributes.attributes || '' ) );
				if ( match ) {
					blockAttributes[ match[ 1 ] ] = !! match[ 2 ] ? match[ 3 ] : true;
				}
			} while ( !! match );

			// Try to create the block
			const contentObject = mceNodeToObjectTree( currentNode );
			const block = createBlockWithFallback(
				nodeAttributes.slug,
				rawContent,
				blockAttributes,
				contentObject
			);
			if ( block ) {
				flushContentBetweenBlocks();
				blocks.push( block );
			}

			currentNode = currentNode.next;
		} else {
			// We have some HTML content outside of block delimiters.  First
			// see if the current node validates against any block schemas.
			// TODO: We will need a way to match multiple tags against multiple
			// schemas, and this should happen in `flushContentBetweenBlocks`
			// instead.  We'll have to be careful to manage the algorithmic
			// complexity well here, as the number of possible matches will
			// quickly grow very large.
			const currentNodeObject = mceNodeToObjectTree( currentNode );
			const matchingBlocks = blocksWithSchemas.filter( block => {
				const result = block.schema.validateNode( currentNodeObject );
				// TODO: Eventually, `result` will contain any parameters
				// deserialized from the HTML, as well as information about
				// which branch of the schema was used, extra attributes
				// present in the markup, etc.
				return ( result === true );
			} );

			if ( matchingBlocks.length > 1 ) {
				console.error(
					'More than 1 block found matching HTML string \'%s\': %s',
					serializer.serialize( currentNode ),
					matchingBlocks.map( block => block.slug ).join( ', ' )
				);
			} else if ( matchingBlocks.length === 1 ) {
				const contentString = serializer.serialize( currentNode );
				const block = createBlockWithFallback(
					matchingBlocks[ 0 ].slug,
					contentString,
					null // no known attributes
				);
				if ( block ) {
					flushContentBetweenBlocks();
					blocks.push( block );
					currentNode = currentNode.next;
					continue;
				}
			}

			// If we get here, then we were unable to match the current node
			// against a block schema for one reason or another, and we need to
			// store it in `contentBetweenBlocks` instead.

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

export default parseWithTinyMCE;
