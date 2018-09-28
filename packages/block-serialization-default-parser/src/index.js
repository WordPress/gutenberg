let document;
let offset;
let output;
let stack;
const tokenizer = /<!--\s+(\/)?wp:([a-z][a-z0-9_-]*\/)?([a-z][a-z0-9_-]*)\s+({(?:(?!}\s+-->)[^])+?}\s+)?(\/)?-->/g;

function Block( blockName, attrs, innerBlocks, innerHTML ) {
	return {
		blockName,
		attrs,
		innerBlocks,
		innerHTML,
	};
}

function Frame( block, tokenStart, tokenLength, prevOffset, leadingHtmlStart ) {
	return {
		block,
		tokenStart,
		tokenLength,
		prevOffset: prevOffset || tokenStart + tokenLength,
		leadingHtmlStart,
	};
}

export const parse = ( doc ) => {
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

function proceed() {
	const next = nextToken();
	const [ tokenType, blockName, attrs, startOffset, tokenLength ] = next;
	const stackDepth = stack.length;

	// we may have some HTML soup before the next block
	const leadingHtmlStart = ( startOffset > offset ) ? offset : null;

	switch ( tokenType ) {
		case 'no-more-tokens':
			// if not in a block then flush output
			if ( 0 === stackDepth ) {
				addFreeform();
				return false;
			}

			// Otherwise we have a problem
			// This is an error
			// we have options
			//  - treat it all as freeform text
			//  - assume an implicit closer (easiest when not nesting)

			// for the easy case we'll assume an implicit closer
			if ( 1 === stackDepth ) {
				addBlockFromStack();
				return false;
			}

			// for the nested case where it's more difficult we'll
			// have to assume that multiple closers are missing
			// and so we'll collapse the whole stack piecewise
			while ( 0 < stack.length ) {
				addBlockFromStack();
			}
			return false;

		case 'void-block':
			// easy case is if we stumbled upon a void block
			// in the top-level of the document
			if ( 0 === stackDepth ) {
				if ( null !== leadingHtmlStart ) {
					output.push( {
						attrs: {},
						innerHTML: document.substr( leadingHtmlStart, startOffset - leadingHtmlStart ),
					} );
				}
				output.push( Block( blockName, attrs, [], '' ) );
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we found an inner block
			addInnerBlock(
				Block( blockName, attrs, [], '' ),
				startOffset,
				tokenLength,
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-opener':
			// track all newly-opened blocks on the stack
			stack.push(
				Frame(
					Block( blockName, attrs, [], '' ),
					startOffset,
					tokenLength,
					startOffset + tokenLength,
					leadingHtmlStart,
				),
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-closer':
			// if we're missing an opener we're in trouble
			// This is an error
			if ( 0 === stackDepth ) {
				// we have options
				//  - assume an implicit opener
				//  - assume _this_ is the opener
				//  - give up and close out the document
				addFreeform();
				return false;
			}

			// if we're not nesting then this is easy - close the block
			if ( 1 === stackDepth ) {
				addBlockFromStack( startOffset );
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we're nested and we have to close out the current
			// block and add it as a innerBlock to the parent
			const stackTop = stack.pop();
			stackTop.block.innerHTML += document.substr(
				stackTop.prevOffset,
				startOffset - stackTop.prevOffset,
			);
			stackTop.prevOffset = startOffset + tokenLength;

			addInnerBlock(
				stackTop.block,
				stackTop.tokenStart,
				stackTop.tokenLength,
				startOffset + tokenLength,
			);
			offset = startOffset + tokenLength;
			return true;

		default:
			// This is an error
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
 * @param {string} input JSON input string to parse
 * @return {Object|null} parsed JSON if valid
 */
function parseJSON( input ) {
	try {
		return JSON.parse( input );
	} catch ( e ) {
		return null;
	}
}

function nextToken() {
	// aye the magic
	// we're using a single RegExp to tokenize the block comment delimiters
	// we're also using a trick here because the only difference between a
	// block opener and a block closer is the leading `/` before `wp:` (and
	// a closer has no attributes). we can trap them both and process the
	// match back in Javascript to see which one it was.
	const matches = tokenizer.exec( document );

	// we have no more tokens
	if ( null === matches ) {
		return [ 'no-more-tokens' ];
	}

	const startedAt = matches.index;
	const [ match, closerMatch, namespaceMatch, nameMatch, attrsMatch, voidMatch ] = matches;

	const length = match.length;
	const isCloser = !! closerMatch;
	const isVoid = !! voidMatch;
	const namespace = namespaceMatch || 'core/';
	const name = namespace + nameMatch;
	const hasAttrs = !! attrsMatch;
	const attrs = hasAttrs ? parseJSON( attrsMatch ) : null;

	// This state isn't allowed
	// This is an error
	if ( isCloser && ( isVoid || hasAttrs ) ) {
		// we can ignore them since they don't hurt anything
		// we may warn against this at some point or reject it
	}

	if ( isVoid ) {
		return [ 'void-block', name, attrs, startedAt, length ];
	}

	if ( isCloser ) {
		return [ 'block-closer', name, null, startedAt, length ];
	}

	return [ 'block-opener', name, attrs, startedAt, length ];
}

function addFreeform( rawLength ) {
	const length = rawLength ? rawLength : document.length - offset;

	if ( 0 === length ) {
		return;
	}

	// why is this not a Frame? it's because the current grammar
	// specifies an object that's different. we can update the
	// specification and change here if we want to but for now we
	// want this parser to be spec-compliant
	output.push( {
		attrs: {},
		innerHTML: document.substr( offset, length ),
	} );
}

function addInnerBlock( block, tokenStart, tokenLength, lastOffset ) {
	const parent = stack[ stack.length - 1 ];
	parent.block.innerBlocks.push( block );
	parent.block.innerHTML += document.substr(
		parent.prevOffset,
		tokenStart - parent.prevOffset,
	);
	parent.prevOffset = lastOffset ? lastOffset : tokenStart + tokenLength;
}

function addBlockFromStack( endOffset ) {
	const { block, leadingHtmlStart, prevOffset, tokenStart } = stack.pop();

	if ( endOffset ) {
		block.innerHTML += document.substr( prevOffset, endOffset - prevOffset );
	} else {
		block.innerHTML += document.substr( prevOffset );
	}

	if ( null !== leadingHtmlStart ) {
		output.push( {
			attrs: {},
			innerHTML: document.substr( leadingHtmlStart, tokenStart - leadingHtmlStart ),
		} );
	}

	output.push( block );
}
