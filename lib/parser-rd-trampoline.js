/**
 * Sitting here for now in the PR because I don't have a better place for it.
 */

let document;
let offset;
let output;
let stack;
const tokenizer = /<!--\s+(?<closer>\/)?wp:(?<namespace>[a-z][a-z0-9_-]*\/)?(?<name>[a-z][a-z0-9_-]*)\s+(?<attrs>{(?:(?!}\s+-->)[^])+}\s+)?(?<void>\/)?-->/g;

class Block {
	constructor(name, attrs, innerBlocks, innerHTML) {
		this.blockName = name;
		this.attrs = attrs;
		this.innerBlocks = innerBlocks;
		this.innerHTML = innerHTML;
	}
}

class Frame {
	constructor(block, tokenStart, tokenLength, prevOffset) {
		this.block = block;
		this.tokenStart = tokenStart;
		this.tokenLength = tokenLength;
		this.prevOffset = prevOffset || (tokenStart + tokenLength);
	}
}

export const parse = (doc) => {
	document = doc;
	offset = 0;
	output = [];
	stack = [];
	tokenizer.lastIndex = 0;

	do {
		// twiddle our thumbs
	} while (proceed());

	return output;
}

function proceed() {
	const [tokenType, block_name, attrs, startOffset, tokenLength] = nextToken();
	const stackDepth = stack.length;

	switch (tokenType) {
		case 'no-more-tokens':
			// if not in a block then flush output
			if (0 === stackDepth) {
				addFreeform();
				return false;
			}

			// Otherwise we have a problem
			// This is an error
			error('in a block but found no closer');
			error('failed at ' + offset);

			// we have options
			//  - treat it all as freeform text
			//  - assume an implicit closer (easiest when not nesting)

			// for the easy case we'll assume an implicit closer
			if (1 === stackDepth) {
				error(' - treating as implicit closer');
				addBlockFromStck();
				return false;
			}

			// for the nested case where it's more difficult we'll
			// have to assume that multiple closers are missing
			// and so we'll collapse the whole stack piecewise
			error(' - multiple closers are missing');
			error(' - recursively collapsing stack of blocks');
			while (0 < stack.length) {
				addBlockFromStck();
			}
			return false;

		case 'void-block':
			// easy case is if we stumbled upon a void block
			// in the top-level of the document
			if (0 === stackDepth) {
				output.push(new Block(block_name, attrs, [], ''));
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we found an inner block
			addInnerBlock(
				new Block(block_name, attrs, [], ''),
				startOffset,
				tokenLength
			);
			offset = startOffset + tokenLength;
			return true;

		case 'block-opener':
			// we may have some HTML soup before the next block
			if (startOffset > offset) {
				addFreeform(startOffset - offset);
			}

			// track all newly-opened blocks on the stack
			stack.push(new Frame(
				new Block(block_name, attrs, [], ''),
				startOffset,
				tokenLength,
				startOffset + tokenLength
			));
			offset = startOffset + tokenLength;
			return true;

		case 'block-closer':
			// if we're missing an opener we're in trouble
			// This is an error
			if (0 === stackDepth) {
				error('found a closer with no opening block');
				error('failed at offset ' + startOffset);

				// we have options
				//  - assume an implicit opener
				//  - assume _this_ is the opener
				//  - give up and close out the document
				addFreeform();
				return false;
			}

			// if we're not nesting then this is easy - close the block
			if (1 === stackDepth) {
				addBlockFromStck(startOffset);
				offset = startOffset + tokenLength;
				return true;
			}

			// otherwise we're nested and we have to close out the current
			// block and add it as a new innerBlock to the parent
			stackTop = stack.pop();
			stackTop.block.innerHTML += document.substr(stackTop.prevOffset, startOffset - stackTop.prevOffset);
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
			// This is an error
			error('found unexpected token at offset ' + offset);
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
	// match back in PHP to see which one it was.
	const matches = tokenizer.exec(document);

	// we have no more tokens
	if (null === matches) {
		return ['no-more-tokens'];
	}

	const startedAt = matches.index;
	const match = matches[0];

	const length = match.length;
	const isCloser = !!matches.groups.closer;
	const isVoid = !!matches.groups.void;
	const namespace = matches.groups.namespace || 'core/';
	const name = namespace + matches.groups.name;
	const hasAttrs = !!matches.groups.attrs;
	const attrs = hasAttrs ? JSON.parse(matches.groups.attrs) : null;

	// This state isn't allowed
	// This is an error
	if (isCloser && (isVoid || hasAttrs)) {
		error('closing comment delimiters must not have attributes or void closers');
		error('failed at offset ' + startedAt + ': ' + match);

		// we can ignore them since they don't hurt anything
	}

	if (isVoid) {
		return ['void-block', name, attrs, startedAt, length];
	}

	if (isCloser) {
		return ['block-closer', name, null, startedAt, length];
	}

	return ['block-opener', name, attrs, startedAt, length];
}

function addFreeform(rawLength) {
	const length = rawLength ? rawLength : document.length - offset;

	if (0 === length) {
		return;
	}

	output.push({
		'attrs': {},
		'innerHTML': document.substr(offset, length),
	});
}

function addInnerBlock(block, tokenStart, tokenLength, lastOffset) {
	parent = stack[stack.length - 1];
	parent.block.innerBlocks.push(block);
	parent.block.innerHTML += document.substr(parent.prevOffset, tokenStart - parent.prevOffset);
	parent.prevOffset = lastOffset ? lastOffset : tokenStart + tokenLength;
}

function addBlockFromStck(endOffset) {
	stackTop = stack.pop();
	prevOffset = stackTop.prevOffset;

	stackTop.block.innerHTML += endOffset ? document.substr(prevOffset, endOffset - prevOffset) : document.substr(prevOffset);

	output.push(stackTop.block);
}

function error(message) {
	console.log(message);
}
