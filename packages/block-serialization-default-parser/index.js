let document;
let offset;
let output;
let stack;
const tokenizer = /<!--\s+(?<closer>\/)?wp:(?<namespace>[a-z][a-z0-9_-]*\/)?(?<name>[a-z][a-z0-9_-]*)\s+(?<attrs>{(?:(?!}\s+-->)[^])+}\s+)?(?<void>\/)?-->/g;

class Block {
	constructor( name, attrs, innerBlocks, innerHTML ) {
		this.blockName = name;
		this.attrs = attrs;
		this.innerBlocks = innerBlocks;
		this.innerHTML = innerHTML;
	}
}

class Frame {
	constructor( block, tokenStart, tokenLength, prevOffset ) {
		this.block = block;
		this.tokenStart = tokenStart;
		this.tokenLength = tokenLength;
		this.prevOffset = prevOffset || tokenStart + tokenLength;
	}
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
	const [ tokenType, blockName, attrs, startOffset, tokenLength ] = nextToken();
	const stackDepth = stack.length;

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
				output.push( new Block( blockName, attrs, [], '' ) );
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we found an inner block
			addInnerBlock(
				new Block( blockName, attrs, [], '' ),
				startOffset,
				tokenLength,
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-opener':
			// we may have some HTML soup before the next block
			if ( startOffset > offset ) {
				addFreeform( startOffset - offset );
			}

			// track all newly-opened blocks on the stack
			stack.push(
				new Frame(
					new Block( blockName, attrs, [], '' ),
					startOffset,
					tokenLength,
					startOffset + tokenLength,
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
			// block and add it as a new innerBlock to the parent
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
	const attrs = hasAttrs ? JSON.parse( attrsMatch ) : null;

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
	const stackTop = stack.pop();
	const prevOffset = stackTop.prevOffset;

	if ( endOffset ) {
		stackTop.block.innerHTML += document.substr( prevOffset, endOffset - prevOffset );
	} else {
		stackTop.block.innerHTML += document.substr( prevOffset );
	}

	output.push( stackTop.block );
}
