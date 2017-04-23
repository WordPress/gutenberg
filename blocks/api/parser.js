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

/**
 * Matches opening block comments
 *
 *   <!-- wp:block/type arg:14 value:something -->
 *
 * This includes the global flag so that we can
 * track not only where the string begins but also
 * where it ends with the `.lastIndex` property
 *
 * @type {RegExp}
 */
const blockOpenerPattern = /<!--\s*wp:([a-z](?:[a-z0-9/][a-z0-9]+)*)\s+((?:(?!-->).)*)-->/ig;

/**
 * Matches closing block comments
 *
 *   <!-- /wp:block/type -->
 *
 * This includes the global flag so that we can
 * track not only where the string begins but also
 * where it ends with the `.lastIndex` property
 *
 * @type {RegExp}
 */
const blockCloserPattern = /<!--\s*\/wp:([a-z](?:[a-z0-9/][a-z0-9]+)*)\s+-->/ig;

/**
 * Splits a string once at a given delimiter
 *
 * @param {String} delimiter pattern at which to split string
 * @param {String} s input string to split
 * @returns {[String,String]} [part before delimiter, part after delimiter]
 */
function splitAt( delimiter, s ) {
	const [ name, ...values ] = s.split( delimiter );

	return [ name, values.join( '' ) ];
}

/**
 * Takes a string containing block comment attributes and
 * returns an object of key/value pairs representing same
 *
 * Note: The last of a repeating definition of an attribute
 *       for a given key will be the value of the attribute
 *       in the returned object.
 *
 * @param {String} attrs e.g. "   id:14 url:https://s0.wp.com/thing
 * @returns {Object<String,String>} key/value pairs of attributes
 */
function regexParseAttrs( attrs ) {
	return attrs
		.trim()
		.split( /\s+/ )
		.map( s => splitAt( ':', s ) )
		.filter( ( [ name, /* value */ ] ) => !! name )
		.reduce( ( o, [ name, value ] ) => ( { ...o, [ name ]: value } ), {} );
}

/**
 * Parses the post content with a RegExp based parser
 * and returns a list of block data structures
 *
 * Scans the content to find block opening and block closing
 * comments. When we find an opening, push the accumulated
 * content into the output, track the opening, and descend
 * into the remaining content and repeat. When we find a
 * closing comment, fill in the accumulated content into the
 * passed partial block and append into the output, and repeat.
 * If any content remains past the last closing comment return
 * as the remainder to be later appended to the output as a
 * free-form block.
 *
 * @TODO: This messes up nested nodes; fix by handling children
 *        in another accumulator and merging on close to preserve
 *        the tail-call recursion. Note that blocks are not yet
 *        nested so right now it's not a problem.
 *
 * @example
 * content    output           remaining openBlock
 *
 * A(Sub)Expr []               (Sub)Expr .
 * Sub)Expr   [{A}]            Sub)Expr  {}
 * )Expr      [{A}{Sub}]       )Expr     .
 * Expr       [{A}{Sub}]       Expr      {}
 *            [{A}{Sub}{Expr}]
 *
 * @param {String} content running post content to parse
 * @param {Array<Object>} [output=[]] running total output of parser
 * @param {String} [remaining=''] running remaining content to parse not captured by parser
 * @param {?Object} openBlock partial block information to carry along if opening a block
 * @returns {Array<Object>|Function} final parsed content or a continuation thunk for recursion
 */
export function regExpParser( content, output = [], remaining = '', openBlock = null ) {
	blockOpenerPattern.lastIndex = 0; // RegExp with `g` flag (which we need to read lastIndex)
	blockCloserPattern.lastIndex = 0; // must be reset or we will get skewed indices
	const firstOpen = blockOpenerPattern.exec( content );
	const firstClose = blockCloserPattern.exec( content );

	if ( ! content ) {
		return [ output, remaining ];
	}

	// no blocks at all
	if ( ! firstOpen && ! firstClose ) {
		if ( openBlock ) {
			throw new SyntaxError( 'Cannot leave a block unclosed' );
		}

		return [ output.concat[ { attrs: {}, rawContent: content } ], remaining ];
	}

	// closing a non-existent block
	if ( firstClose && firstOpen && firstClose.index < firstOpen.index && ! openBlock ) {
		throw new SyntaxError( 'Cannot close a block that isn\'t open' );
	}

	// closing an existing block
	if ( firstClose && ( ! firstOpen || firstClose.index < firstOpen.index ) ) {
		return () => regExpParser(
			content.slice( blockCloserPattern.lastIndex ),
			output.concat( { ...openBlock, rawContent: content.slice( 0, firstClose.index ) } ),
			content.slice( blockCloserPattern.lastIndex ),
			null
		);
	}

	// open a block
	if ( firstOpen ) {
		const [ /* fullMatch */, blockType, rawAttrs ] = firstOpen;
		const attrs = regexParseAttrs( rawAttrs );

		return () => regExpParser(
			content.slice( blockOpenerPattern.lastIndex ),
			output,
			content.slice( blockOpenerPattern.lastIndex ),
			{ blockType, attrs }
		);
	}

	return [ output, remaining ];
}

/**
 * Run tail-call-recursive functions in constant stack space
 *
 * Cannot be used in this form to eventually return a function!
 * If you need to return a function this requires a slight
 * modification to the transformed function such that it always
 * returns a pair: [ next thunk or stop, value of accumulators ]
 *
 * This method has been chosen because it is simpler to implement
 * and read and keeps some noise out of the wrapped functions.
 *
 * @see https://en.wikipedia.org/wiki/Tail_call#Through_trampolining
 *
 * @example
 * // stack overflow
 * const factorial = ( n, a = 1 ) => n > 1 ? factorial( n - 1, n * a ) : a;
 * factorial( 20000 );
 *
 * // safe
 * const factorial = ( n, a = 1 ) => n > 1 ? () => factorial( n - 1, n * a ) : a;
 * trampoline( factorial( 20000 ) );
 *
 * @param {*} f trampolined function to call, or a non-function value
 * @returns {*} non-function value returned by trampoline
 */
function simpleTrampoline( f ) {
	while ( 'function' === typeof f ) {
		f = f();
	}

	return f;
}

export function parseWithRegExp( content ) {
	const [ doc, remaining ] = simpleTrampoline( regExpParser( content ) );

	return doc
		.concat( { attrs: {}, rawContent: remaining } )
		.reduce( ( memo, blockNode ) => {
			const { blockType, rawContent, attrs } = blockNode;
			const block = createBlockWithFallback( blockType, rawContent, attrs );
			if ( block ) {
				memo.push( block );
			}
			return memo;
		}, [] );
}

export default parseWithRegExp;
