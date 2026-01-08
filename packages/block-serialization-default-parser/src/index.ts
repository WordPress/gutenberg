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
	| 'no-more-tokens'
	| 'void-block'
	| 'block-opener'
	| 'block-closer';

type Token = [ TokenType, string, Attributes, number, number ];

/**
 * Matches block comment delimiters
 *
 * While most of this pattern is straightforward the attribute parsing
 * incorporates a tricks to make sure we don't choke on specific input
 *
 *  - since JavaScript has no possessive quantifier or atomic grouping
 *    we are emulating it with a trick
 *
 *    we want a possessive quantifier or atomic group to prevent backtracking
 *    on the `}`s should we fail to match the remainder of the pattern
 *
 *    we can emulate this with a positive lookahead and back reference
 *    (a++)*c === ((?=(a+))\1)*c
 *
 *    let's examine an example:
 *      - /(a+)*c/.test('aaaaaaaaaaaaad') fails after over 49,000 steps
 *      - /(a++)*c/.test('aaaaaaaaaaaaad') fails after 85 steps
 *      - /(?>a+)*c/.test('aaaaaaaaaaaaad') fails after 126 steps
 *
 *    this is because the possessive `++` and the atomic group `(?>)`
 *    tell the engine that all those `a`s belong together as a single group
 *    and so it won't split it up when stepping backwards to try and match
 *
 *    if we use /((?=(a+))\1)*c/ then we get the same behavior as the atomic group
 *    or possessive and prevent the backtracking because the `a+` is matched but
 *    not captured. thus, we find the long string of `a`s and remember it, then
 *    reference it as a whole unit inside our pattern
 *
 *    @see http://instanceof.me/post/52245507631/regex-emulate-atomic-grouping-with-lookahead
 *    @see http://blog.stevenlevithan.com/archives/mimic-atomic-groups
 *    @see https://javascript.info/regexp-infinite-backtracking-problem
 *
 *    once browsers reliably support atomic grouping or possessive
 *    quantifiers natively we should remove this trick and simplify
 *
 * @since 3.8.0
 * @since 4.6.1 added optimization to prevent backtracking on attribute parsing
 */
const tokenizer =
	/<!--\s+(\/)?wp:([a-z][a-z0-9_-]*\/)?([a-z][a-z0-9_-]*)\s+({(?:(?=([^}]+|}+(?=})|(?!}\s+\/?-->)[^])*)\5|[^]*?)}\s+)?(\/)?-->/g;

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
	tokenizer.lastIndex = 0;

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
			// If not in a block then flush output.
			if ( 0 === stackDepth ) {
				addFreeform();
				return false;
			}

			// Otherwise we have a problem
			// This is an error
			// we have options
			//  - treat it all as freeform text
			//  - assume an implicit closer (easiest when not nesting)

			// For the easy case we'll assume an implicit closer.
			if ( 1 === stackDepth ) {
				addBlockFromStack();
				return false;
			}

			// For the nested case where it's more difficult we'll
			// have to assume that multiple closers are missing
			// and so we'll collapse the whole stack piecewise.
			while ( 0 < stack.length ) {
				addBlockFromStack();
			}
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
			stackTop.block.innerHTML += html;
			stackTop.block.innerContent.push( html );
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
	} catch ( e ) {
		return null;
	}
}

/**
 * Finds the next token in the document.
 *
 * @return The next matched token.
 */
function nextToken(): Token {
	// Aye the magic
	// we're using a single RegExp to tokenize the block comment delimiters
	// we're also using a trick here because the only difference between a
	// block opener and a block closer is the leading `/` before `wp:` (and
	// a closer has no attributes). we can trap them both and process the
	// match back in JavaScript to see which one it was.
	const matches = tokenizer.exec( document );

	// We have no more tokens.
	if ( null === matches ) {
		return [ 'no-more-tokens', '', null, 0, 0 ];
	}

	const startedAt = matches.index;
	const [
		match,
		closerMatch,
		namespaceMatch,
		nameMatch,
		attrsMatch /* Internal/unused. */,
		,
		voidMatch,
	] = matches;

	const length = match.length;
	const isCloser = !! closerMatch;
	const isVoid = !! voidMatch;
	const namespace = namespaceMatch || 'core/';
	const name = namespace + nameMatch;
	const hasAttrs = !! attrsMatch;
	const attrs = hasAttrs ? parseJSON( attrsMatch ) : {};

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
