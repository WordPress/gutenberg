let document: string;
let offset: number;
let output: ParsedBlock[];
let stack: ParsedFrame[];

type Attributes = Record< string, any > | null;

type ParsedBlock = {
	blockName: string | null;
	attrs: Attributes;
	innerBlocks: ParsedBlock[];
	innerHTML: string;
	innerContent: Array< string | null >;
};

type ParsedFrame = {
	block: ParsedBlock;
	tokenStart: number;
	tokenLength: number;
	prevOffset: number;
	leadingHtmlStart: number | null;
};

type TokenType =
	'no-more-tokens' | 'void-block' | 'block-opener' | 'block-closer';

type Token = [ TokenType, string, Attributes, number, number ];

/**
 * Matches block comment delimiter candidates
 *
 * Sub-matches:
 *  1. Leading “closer” solidus before `wp`
 *  2. Namespace
 *  3. Block name
 *
 * @since 24.3.0
 */
const delimiterPrefixPattern =
	/[ \t\f\r\n]+(\/)?wp:([a-z][a-z0-9_-]*\/)?([a-z][a-z0-9_-]*)[ \t\f\r\n]+/g;

/**
 * Matches the end of a block delimiter’s JSON attribute area.
 *
 * Sub-matches:
 *  1. Void flag
 *
 * @since 24.3.0
 */
const attributeAreaClosingPattern = /}[ \t\f\r\n]+(\/)?$/g;

/**
 * Matches the start of an HTML comment;
 *
 * @since 24.3.0
 */
const commentStartPattern = /<!--/g;

/**
 * Matches the end of an open HTML comment.
 *
 * @since 24.3.0
 */
const commentEndPattern = /^-*>|--!?>/g;

/**
 * Constructs a block object.
 *
 * @param blockName    Either the abbreviated core types, e.g. "paragraph", or the fully-qualified
 *                     block type with namespace and type, e.g. "core/paragraph" or "my-plugin/csv-table".
 * @param attrs        The attributes for the block, or null if there are no attributes.
 * @param innerBlocks  An array of inner blocks.
 * @param innerHTML    The inner HTML of the block.
 * @param innerContent An array of inner content strings.
 * @return The block object.
 */
function Block(
	blockName: string | null,
	attrs: Attributes,
	innerBlocks: ParsedBlock[],
	innerHTML: string,
	innerContent: string[]
): ParsedBlock {
	return {
		blockName,
		attrs,
		innerBlocks,
		innerHTML,
		innerContent,
	};
}

/**
 * Constructs a freeform block object.
 *
 * @param innerHTML The inner HTML of the block.
 * @return The freeform block object.
 */
function Freeform( innerHTML: string ): ParsedBlock {
	return Block( null, {}, [], innerHTML, [ innerHTML ] );
}

/**
 * Constructs a frame object.
 *
 * @param block            The block object.
 * @param tokenStart       The start offset of the token in the document.
 * @param tokenLength      The length of the token in the document.
 * @param prevOffset       The offset of the previous token in the document.
 * @param leadingHtmlStart The start offset of leading HTML before the block.
 * @return The frame object.
 */
function Frame(
	block: ParsedBlock,
	tokenStart: number,
	tokenLength: number,
	prevOffset: number | null,
	leadingHtmlStart: number | null
): ParsedFrame {
	return {
		block,
		tokenStart,
		tokenLength,
		prevOffset: prevOffset || tokenStart + tokenLength,
		leadingHtmlStart,
	};
}

/**
 * Parser function, that converts input HTML into a block based structure.
 *
 * @param doc The HTML document to parse.
 *
 * @example
 * Input post:
 * ```html
 * <!-- wp:columns {"columns":3} -->
 * <div class="wp-block-columns has-3-columns"><!-- wp:column -->
 * <div class="wp-block-column"><!-- wp:paragraph -->
 * <p>Left</p>
 * <!-- /wp:paragraph --></div>
 * <!-- /wp:column -->
 *
 * <!-- wp:column -->
 * <div class="wp-block-column"><!-- wp:paragraph -->
 * <p><strong>Middle</strong></p>
 * <!-- /wp:paragraph --></div>
 * <!-- /wp:column -->
 *
 * <!-- wp:column -->
 * <div class="wp-block-column"></div>
 * <!-- /wp:column --></div>
 * <!-- /wp:columns -->
 * ```
 *
 * Parsing code:
 * ```js
 * import { parse } from '@wordpress/block-serialization-default-parser';
 *
 * parse( post ) === [
 *     {
 *         blockName: "core/columns",
 *         attrs: {
 *             columns: 3
 *         },
 *         innerBlocks: [
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [
 *                     {
 *                         blockName: "core/paragraph",
 *                         attrs: null,
 *                         innerBlocks: [],
 *                         innerHTML: "\n<p>Left</p>\n"
 *                     }
 *                 ],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             },
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [
 *                     {
 *                         blockName: "core/paragraph",
 *                         attrs: null,
 *                         innerBlocks: [],
 *                         innerHTML: "\n<p><strong>Middle</strong></p>\n"
 *                     }
 *                 ],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             },
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             }
 *         ],
 *         innerHTML: '\n<div class="wp-block-columns has-3-columns">\n\n\n\n</div>\n'
 *     }
 * ];
 * ```
 * @return A block-based representation of the input HTML.
 */
export const parse = ( doc: string ): ParsedBlock[] => {
	document = doc;
	offset = 0;
	output = [];
	stack = [];
	delimiterPrefixPattern.lastIndex = 0;

	do {
		// twiddle our thumbs
	} while ( proceed() );

	return output;
};

/**
 * Parses the next token in the input document.
 *
 * @return Returns true when there is more tokens to parse.
 */
function proceed(): boolean {
	const stackDepth = stack.length;
	const next = nextToken();
	const [ tokenType, blockName, attrs, startOffset, tokenLength ] = next;

	// We may have some HTML soup before the next block.
	const leadingHtmlStart = startOffset > offset ? offset : null;

	switch ( tokenType ) {
		case 'no-more-tokens':
			/*
			 * Most documents will end with all blocks properly closed.
			 * In these cases, all that’s necessary is to flush the output.
			 * There is probably a terminating newline.
			 */
			if ( 0 === stackDepth ) {
				addFreeform();
				return false;
			}

			/*
			 * However, if blocks remain open it means there were missing
			 * closing block delimiters. The post may have been truncated,
			 * for example, but some amount of corruption produced a malformed
			 * document.
			 *
			 * The spec parser considers this a parse error and returns a long
			 * freeform block containing the full span of text from the input
			 * document from the start of the un-closed block.
			 *
			 * This parser, however, is making a different pragmatic choice: it
			 * will implicitly close any remaining open blocks, as if the closers
			 * were provided. This ensures recovery of as much of the provided
			 * block structure as is possible.
			 */
			implicitlyCloseAllOpenBlocks();
			return false;
		case 'void-block':
			// easy case is if we stumbled upon a void block
			// in the top-level of the document.
			if ( 0 === stackDepth ) {
				if ( null !== leadingHtmlStart ) {
					output.push(
						Freeform(
							document.substr(
								leadingHtmlStart,
								startOffset - leadingHtmlStart
							)
						)
					);
				}
				output.push( Block( blockName, attrs, [], '', [] ) );
				offset = startOffset + tokenLength;
				return true;
			}

			// Otherwise we found an inner block.
			addInnerBlock(
				Block( blockName, attrs, [], '', [] ),
				startOffset,
				tokenLength
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-opener':
			// Track all newly-opened blocks on the stack.
			stack.push(
				Frame(
					Block( blockName, attrs, [], '', [] ),
					startOffset,
					tokenLength,
					startOffset + tokenLength,
					leadingHtmlStart
				)
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-closer':
			// If we're missing an opener we're in trouble
			// This is an error.
			if ( 0 === stackDepth ) {
				// We have options
				//  - assume an implicit opener
				//  - assume _this_ is the opener
				// - give up and close out the document.
				addFreeform();
				return false;
			}

			// If we're not nesting then this is easy - close the block.
			if ( 1 === stackDepth ) {
				addBlockFromStack( startOffset );
				offset = startOffset + tokenLength;
				return true;
			}

			// Otherwise we're nested and we have to close out the current
			// block and add it as a innerBlock to the parent.
			const stackTop = stack.pop() as ParsedFrame;
			const html = document.substr(
				stackTop.prevOffset,
				startOffset - stackTop.prevOffset
			);

			if ( html ) {
				stackTop.block.innerHTML += html;
				stackTop.block.innerContent.push( html );
			}

			stackTop.prevOffset = startOffset + tokenLength;

			addInnerBlock(
				stackTop.block,
				stackTop.tokenStart,
				stackTop.tokenLength,
				startOffset + tokenLength
			);
			offset = startOffset + tokenLength;
			return true;

		default:
			// This is an error.
			addFreeform();
			return false;
	}
}

/**
 * Parse JSON if valid, otherwise return null
 *
 * Note that JSON coming from the block comment
 * delimiters is constrained to be an object
 * and cannot be things like `true` or `null`
 *
 * @param input JSON input string to parse
 * @return parsed JSON if valid or null if invalid
 */
function parseJSON( input: string ): Object | null {
	try {
		return JSON.parse( input );
	} catch {
		return null;
	}
}

/**
 * Finds the next token in the document.
 *
 * @return The next matched token.
 */
function nextToken(): Token {
	while ( offset < document.length ) {
		commentStartPattern.lastIndex = offset;
		const nextComment = commentStartPattern.exec( document );

		// If there are no more comment openers then there are no more blocks.
		if ( null === nextComment ) {
			offset = document.length;
			break;
		}

		// Find the end of the potential delimiter. Start after the opening `<!--`.
		commentEndPattern.lastIndex = commentStartPattern.lastIndex;
		const commentEnd = commentEndPattern.exec( document );

		// If the comment doesn’t close then there are no more blocks.
		if ( null === commentEnd ) {
			offset = document.length;
			break;
		}

		// The comment closed before a block delimiter could possibly exist.
		//
		//     <!-- ̲w̲p̲:̲a̲ -->                                      ␠   wp  :   a   ␠
		//            ╰ the shortest possible inside contents are 1 + 2 + 1 + 1 + 1 = 6
		if ( commentEnd.index < commentStartPattern.lastIndex + 6 ) {
			offset = commentEndPattern.lastIndex;
			continue;
		}

		// Could this comment be a block delimiter? Start after the opening `<!--`
		delimiterPrefixPattern.lastIndex = commentStartPattern.lastIndex;
		const delimiterPrefix = delimiterPrefixPattern.exec( document );

		// Just another HTML comment.
		if ( null === delimiterPrefix ) {
			offset = commentEndPattern.lastIndex;
			continue;
		}

		// It’s only a block delimiter if there are no JSON attributes or if the potential
		// JSON attributes are a map. It need not be valid JSON, but it must be bounded by
		// curly brackets.

		const attributeAreaLength =
			commentEnd.index - delimiterPrefixPattern.lastIndex;
		const hasAttrs = attributeAreaLength > 0;
		if (
			hasAttrs &&
			'{' !== document[ delimiterPrefixPattern.lastIndex ]
		) {
			offset = commentEndPattern.lastIndex;
			continue;
		}

		const attributeArea = document.slice(
			delimiterPrefixPattern.lastIndex + 1,
			commentEnd.index
		);
		// Skip the opening `{` to find the end of the JSON area.
		attributeAreaClosingPattern.lastIndex = 1;
		const attributeClosing = hasAttrs
			? attributeAreaClosingPattern.exec( attributeArea )
			: null;

		if ( hasAttrs && null === attributeClosing ) {
			offset = commentEndPattern.lastIndex;
			continue;
		}

		const isVoid = '/' === attributeClosing[ 1 ];
		const jsonAttributes = attributeClosing
			? attributeArea.slice( 0, attributeClosing.index + 1 )
			: null;

		const startedAt = nextComment.index;

		const length = commentEndPattern.lastIndex;
		const isCloser = delimiterPrefix[ 1 ];
		const namespace = delimiterPrefix[ 2 ] || 'core/';
		const name = namespace + delimiterPrefix[ 3 ];
		const attrs = jsonAttributes ? parseJSON( jsonAttributes ) : {};

		// This state isn't allowed
		// This is an error.
		if ( isCloser && ( isVoid || hasAttrs ) ) {
			// We can ignore them since they don't hurt anything
			// we may warn against this at some point or reject it.
		}

		if ( isVoid ) {
			return [ 'void-block', name, attrs, startedAt, length ];
		}

		if ( isCloser ) {
			return [ 'block-closer', name, null, startedAt, length ];
		}

		return [ 'block-opener', name, attrs, startedAt, length ];
	}

	// There can be no more tokens.
	return [ 'no-more-tokens', '', null, 0, 0 ];
}

/**
 * Adds a freeform block to the output.
 *
 * @param rawLength Optional length of the raw HTML to include as freeform content.
 */
function addFreeform( rawLength?: number ) {
	const length = rawLength ? rawLength : document.length - offset;

	if ( 0 === length ) {
		return;
	}

	output.push( Freeform( document.substr( offset, length ) ) );
}

/**
 * Adds inner block to the parent block.
 *
 * @param block       The inner block to be added to the parent.
 * @param tokenStart  The start offset of the block token in the document.
 * @param tokenLength The total length of the block token.
 * @param lastOffset  Optional offset marking the end of the current block,
 *                    used to update the parent's HTML content boundaries.
 */
function addInnerBlock(
	block: ParsedBlock,
	tokenStart: number,
	tokenLength: number,
	lastOffset?: number
) {
	const parent = stack[ stack.length - 1 ];
	parent.block.innerBlocks.push( block );
	const html = document.substr(
		parent.prevOffset,
		tokenStart - parent.prevOffset
	);

	if ( html ) {
		parent.block.innerHTML += html;
		parent.block.innerContent.push( html );
	}

	parent.block.innerContent.push( null );
	parent.prevOffset = lastOffset ? lastOffset : tokenStart + tokenLength;
}

/**
 * Adds block from the stack to the output.
 *
 * @param endOffset Optional offset marking the end of the block's HTML content.
 */
function addBlockFromStack( endOffset?: number ) {
	const { block, leadingHtmlStart, prevOffset, tokenStart } =
		stack.pop() as ParsedFrame;

	const html = endOffset
		? document.substr( prevOffset, endOffset - prevOffset )
		: document.substr( prevOffset );

	if ( html ) {
		block.innerHTML += html;
		block.innerContent.push( html );
	}

	if ( null !== leadingHtmlStart ) {
		output.push(
			Freeform(
				document.substr(
					leadingHtmlStart,
					tokenStart - leadingHtmlStart
				)
			)
		);
	}

	output.push( block );
}

/**
 * Closes all open blocks and adds remaining blocks and freeform content to the output list.
 *
 * @since 24.3.0
 */
function implicitlyCloseAllOpenBlocks() {
	let implicitlyClosed: ParsedBlock | null = null;
	let lastFreeform: [ number, number ] | null = null;

	while ( stack.length > 0 ) {
		const stackTop = stack.pop() as ParsedFrame;
		let html: string;

		if ( lastFreeform !== null ) {
			html = document.substr(
				stackTop.prevOffset,
				lastFreeform[ 1 ] - stackTop.prevOffset
			);
		} else {
			html = document.substr( stackTop.prevOffset );
		}

		if ( html ) {
			stackTop.block.innerHTML += html;
			stackTop.block.innerContent.push( html );
		}

		// Trap potential leading freeform content for the final output.
		lastFreeform = [ stackTop.leadingHtmlStart ?? 0, stackTop.tokenStart ];

		if ( implicitlyClosed !== null ) {
			stackTop.block.innerContent.push( null );
			stackTop.block.innerBlocks.push( implicitlyClosed );
		}

		implicitlyClosed = stackTop.block;
	}

	if ( lastFreeform !== null && lastFreeform[ 1 ] > lastFreeform[ 0 ] ) {
		const html = document.substr(
			lastFreeform[ 0 ],
			lastFreeform[ 1 ] - lastFreeform[ 0 ]
		);
		output.push( Freeform( html ) );
	}

	if ( implicitlyClosed !== null ) {
		output.push( implicitlyClosed );
	}
}
