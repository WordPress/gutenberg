/**
 * External dependencies
 */
import * as query from 'hpq';
import { escape, unescape } from 'lodash';

/**
 * Internal dependencies
 */
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
 * @param  {Object} blockNode     Parsed block node
 * @param  {Object} blockSettings Block settings
 * @return {Object}               Block attributes
 */
export function getBlockAttributes( blockNode, blockSettings ) {
	const { rawContent } = blockNode;
	// Merge attributes from parse with block implementation
	let { attrs } = blockNode;
	if ( blockSettings ) {
		attrs = { ...attrs, ...parseBlockAttributes( rawContent, blockSettings ) };
	}

	return attrs;
}

/**
 * Returns a list of blocks extracted from the Post Content
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export default function parse( content ) {
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
			const blockType = getUnknownTypeHandler();
			const settings = getBlockSettings( blockType );
			if ( settings ) {
				const rawContent = serializer.serialize( contentBetweenBlocks );
				const blockNode = { rawContent, attrs: {} };
				const block = createBlock( blockType, getBlockAttributes( blockNode, settings ) );
				blocks.push( block );
			}
		}
		contentBetweenBlocks = new tinymce.html.Node( 'body', 11 );
	}

	let currentNode = tree.firstChild;
	do {
		if ( currentNode.name === 'wp-block' ) {
			// set node type to document fragment so that the TinyMCE
			// serializer doesn't output its markup
			currentNode.type = 11;

			const nodeAttributes = currentNode.attributes.reduce( ( memo, attr ) => {
				memo[ attr.name ] = attr.value;
				return memo;
			}, {} );

			// Use type from block node, otherwise find unknown handler
			let blockType = nodeAttributes.slug || getUnknownTypeHandler();

			// Try finding settings for known block type, else again fall back
			let settings = getBlockSettings( blockType );
			if ( ! settings ) {
				blockType = getUnknownTypeHandler();
				settings = getBlockSettings( blockType );
			}

			// Include in set only if settings were determined
			// TODO when would this fail? error handling?
			if ( settings ) {
				// If we have any pending content outside of block delimiters,
				// add it as a block now.
				flushContentBetweenBlocks();

				const rawContent = serializer.serialize( currentNode );
				const blockAttributes = unescape( nodeAttributes.attributes || '' )
					.split( /\s+/ )
					.reduce( ( memo, attrString ) => {
						const pieces = attrString.match( /^([a-z0-9_-]+):(.*)$/ );
						if ( pieces ) {
							memo[ pieces[ 1 ] ] = pieces[ 2 ];
						}
						return memo;
					}, {} );

				// TODO: allow blocks to opt-in to receiving a tree instead of
				// a string.  Gradually convert all blocks to this new format,
				// then remove the string serialization.
				const blockNode = { rawContent, attrs: blockAttributes };
				const block = createBlock( blockType, getBlockAttributes( blockNode, settings ) );
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
