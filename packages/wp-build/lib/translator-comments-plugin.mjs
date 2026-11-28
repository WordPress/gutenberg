import { RolldownMagicString } from 'rolldown';
import { parseSync } from 'rolldown/utils';

/** @typedef {import('rolldown/utils').ParseResult['comments'][number]} Comment */

/** @typedef {import('rolldown/utils').ESTree.Node} Node */
/** @typedef {import('rolldown/utils').ESTree.CallExpression} CallExpression */

/**
 * A node and where it is in the tree.
 *
 * @typedef {Object} NodeEntry
 * @property {Node}   node          Node.
 * @property {Node}   [parent]      Parent node.
 * @property {string} [key]         Key of the node in its parent.
 * @property {Node}   [grandparent] Parent of the parent node.
 */

/**
 * Names of the gettext functions that `wp i18n make-pot` extracts strings from.
 */
const GETTEXT_FUNCTIONS = new Set( [ '__', '_x', '_n', '_nx' ] );

/**
 * Module types the plugin parses.
 */
const SCRIPT_MODULE_TYPES = [ 'js', 'jsx', 'ts', 'tsx' ];

/**
 * Line terminators, as JavaScript counts them.
 */
const LINE_BREAK = /\r\n?|[\n\u2028\u2029]/g;

/**
 * Check whether a comment is a translator comment, using the same test as
 * `wp i18n make-pot`: after the comment markers and any leading `*`, the text
 * starts with `translators`.
 *
 * @param {string} value Comment text without the `//` or `/*` and `*\/` markers.
 * @return {boolean} Whether the comment is a translator comment.
 */
export function isTranslatorComment( value ) {
	return /^[\s*]*translators/i.test( value );
}

/**
 * Get the name of the function a call expression calls, for the callee shapes
 * `make-pot` understands: `__()`, `i18n.__()`, `wp.i18n.__()` and
 * `( 0, i18n.__ )()`.
 *
 * @param {CallExpression} node Call expression node.
 * @return {string|undefined} Function name, if the callee has one.
 */
function getCalleeName( node ) {
	let callee = node.callee;
	if (
		callee.type === 'SequenceExpression' &&
		callee.expressions.length === 2
	) {
		callee = callee.expressions[ 1 ];
	}
	if ( callee.type === 'Identifier' ) {
		return callee.name;
	}
	if (
		callee.type === 'MemberExpression' &&
		! callee.computed &&
		callee.property.type === 'Identifier'
	) {
		return callee.property.name;
	}
	return undefined;
}

const STATEMENT_KEYS = [ 'body', 'consequent', 'alternate', 'declaration' ];

/**
 * Whether a node sits in a position where Rolldown's printer keeps a JSDoc
 * comment written just before it: a statement, a call or `new` argument, an
 * object property value, a JSX attribute value or a template literal
 * expression. In other positions, such as a conditional branch, an array
 * element, a logical operand, a variable initializer or a `return` argument,
 * the printer drops the comment.
 *
 * @param {NodeEntry} entry Node and where it is.
 * @return {boolean} Whether a leading comment is printed.
 */
function isCommentPreservingPosition( { node, parent, key, grandparent } ) {
	if ( ! parent ) {
		return false;
	}
	if ( isStatement( node ) && STATEMENT_KEYS.includes( key ?? '' ) ) {
		return true;
	}
	switch ( parent.type ) {
		case 'CallExpression':
		case 'NewExpression':
			return key === 'arguments';
		case 'Property':
			return key === 'value' && ! parent.shorthand;
		case 'TemplateLiteral':
			return key === 'expressions';
		case 'JSXExpressionContainer':
			return grandparent?.type === 'JSXAttribute';
	}
	return false;
}

/**
 * Whether a node is a statement or a declaration.
 *
 * @param {Node} node Node.
 * @return {boolean} Whether the node is a statement.
 */
function isStatement( node ) {
	return /(Statement|Declaration)$/.test( node.type );
}

/**
 * Walk an ESTree AST depth-first, in source order.
 *
 * @param {Node}                         node          Node to start from.
 * @param {( entry: NodeEntry ) => void} visit         Called with each node and where it is.
 * @param {Node}                         [parent]      Parent node.
 * @param {string}                       [key]         Key of `node` in `parent`.
 * @param {Node}                         [grandparent] Parent of `parent`.
 */
function walk( node, visit, parent, key, grandparent ) {
	visit( { node, parent, key, grandparent } );
	for ( const [ childKey, child ] of Object.entries( node ) ) {
		const children = Array.isArray( child ) ? child : [ child ];
		for ( const item of children ) {
			if ( item && typeof item.type === 'string' ) {
				walk( item, visit, node, childKey, parent );
			}
		}
	}
}

/**
 * Turn a comment into the text of a JSDoc comment, which Rolldown's printer
 * keeps. A `*\/` inside a line comment is broken up so it can't end the new
 * block comment early.
 *
 * @param {Comment} comment Comment from the parser.
 * @param {string}  text    Comment, with its markers.
 * @return {string} JSDoc comment.
 */
function toJsDocComment( comment, text ) {
	if ( comment.type === 'Line' ) {
		return `/** ${ comment.value.trim().replace( /\*\//g, '* /' ) } */`;
	}
	return text.startsWith( '/**' ) ? text : `/**${ text.slice( 2 ) }`;
}

/**
 * Keep the translator comments of a module in the printed output.
 *
 * Rolldown's printer keeps JSDoc comments, and only in some positions. For
 * each translator comment that `make-pot` would attach to a gettext call (the
 * comment ends on the call's line or the line before), this:
 *
 * - turns the comment into a JSDoc comment where it is, when it directly
 *   precedes the call, or the statement that starts with the call, in a
 *   position the printer keeps;
 * - otherwise moves it into the call, before the call's first argument, a
 *   position the printer always keeps and that `make-pot` reads.
 *
 * Only comments are added, changed or moved, so the code, and so the minified
 * output, stays the same. A module that doesn't parse is left to Rolldown to
 * report.
 *
 * @param {string}                code       Module source.
 * @param {string}                id         Module id.
 * @param {'js'|'jsx'|'ts'|'tsx'} moduleType Module type.
 * @return {RolldownMagicString|null} Edited source, or null if nothing changed.
 */
export function keepTranslatorComments( code, id, moduleType ) {
	const { program, comments, errors } = parseSync( id, code, {
		lang: moduleType,
		sourceType: 'module',
	} );
	if ( errors.length > 0 ) {
		return null;
	}

	const translatorComments = comments.filter( ( comment ) =>
		isTranslatorComment( comment.value )
	);
	if ( translatorComments.length === 0 ) {
		return null;
	}

	// Line start offsets, to turn offsets into line numbers.
	const lineStarts = [ 0 ];
	for ( const match of code.matchAll( LINE_BREAK ) ) {
		lineStarts.push( match.index + match[ 0 ].length );
	}
	/** @type {( offset: number ) => number} */
	const getLine = ( offset ) => {
		let low = 0;
		let high = lineStarts.length - 1;
		while ( low < high ) {
			const middle = Math.ceil( ( low + high ) / 2 );
			if ( lineStarts[ middle ] <= offset ) {
				low = middle;
			} else {
				high = middle - 1;
			}
		}
		return low;
	};

	// The gettext calls, and for each offset the nodes that start there,
	// outermost first.
	/** @type {CallExpression[]} */
	const gettextCalls = [];
	/** @type {Map<number, NodeEntry[]>} */
	const nodesByStart = new Map();
	walk( program, ( entry ) => {
		const { node } = entry;
		const entries = nodesByStart.get( node.start ) ?? [];
		entries.push( entry );
		nodesByStart.set( node.start, entries );
		if (
			node.type === 'CallExpression' &&
			node.arguments.length > 0 &&
			GETTEXT_FUNCTIONS.has( getCalleeName( node ) ?? '' )
		) {
			gettextCalls.push( node );
		}
	} );
	gettextCalls.sort( ( a, b ) => a.start - b.start );

	const commentsByStart = new Map(
		comments.map( ( comment ) => [ comment.start, comment ] )
	);
	/** @type {( offset: number ) => number} */
	const getNextTokenStart = ( offset ) => {
		let position = offset;
		for (;;) {
			while ( /\s/.test( code[ position ] ?? '' ) ) {
				position++;
			}
			const comment = commentsByStart.get( position );
			if ( ! comment ) {
				return position;
			}
			position = comment.end;
		}
	};

	const magicString = new RolldownMagicString( code );

	for ( const comment of translatorComments ) {
		const commentEndLine = getLine( comment.end );

		// The call `make-pot` gives the comment to: the first gettext call that
		// starts after the comment, on the same line or the next, or the call
		// the comment is in, when it comes before the first argument.
		const call = gettextCalls.find(
			( node ) =>
				( node.start >= comment.end &&
					getLine( node.start ) - commentEndLine <= 1 ) ||
				( node.start < comment.start &&
					comment.end <= node.arguments[ 0 ].start )
		);
		if ( ! call ) {
			continue;
		}

		// The comment stays where it is if the printer keeps it there, and it
		// then precedes the call, or the statement that starts on its line.
		const startingNodes = nodesByStart.get(
			getNextTokenStart( comment.end )
		);
		const precedesCall = startingNodes?.some(
			( { node } ) => node === call || node === call.arguments[ 0 ]
		);
		const keptInPlace = startingNodes?.some(
			( entry ) =>
				isCommentPreservingPosition( entry ) &&
				( precedesCall ||
					( isStatement( entry.node ) &&
						getLine( entry.node.start ) ===
							getLine( call.start ) ) )
		);

		const commentText = code.slice( comment.start, comment.end );
		const jsDocComment = toJsDocComment( comment, commentText );
		if ( keptInPlace ) {
			if ( jsDocComment !== commentText ) {
				magicString.overwrite(
					comment.start,
					comment.end,
					jsDocComment
				);
			}
			continue;
		}

		// Otherwise it moves into the call. What replaces it keeps any line
		// break the comment had, as a multi-line comment counts as one for
		// automatic semicolon insertion.
		magicString.overwrite(
			comment.start,
			comment.end,
			/[\r\n\u2028\u2029]/.test( commentText ) ? '\n' : ' '
		);
		magicString.appendLeft(
			call.arguments[ 0 ].start,
			`${ jsDocComment } `
		);
	}

	return magicString.hasChanged() ? magicString : null;
}

/**
 * Rolldown plugin that keeps translator comments (`/* translators: … *\/`
 * and `// translators: …`) in the printed output, next to the gettext call
 * they describe, so `wp i18n make-pot` can extract them from the built
 * files.
 *
 * @return {import('rolldown').Plugin} Rolldown plugin.
 */
export function translatorCommentsPlugin() {
	return {
		name: 'translator-comments',
		transform: {
			filter: {
				code: /translators/i,
				moduleType: SCRIPT_MODULE_TYPES,
			},
			handler( source, id, { moduleType } ) {
				// Rolldown builds the source map from the magic string's edits.
				const code = keepTranslatorComments(
					source,
					id,
					// The filter only lets these module types through.
					/** @type {'js'|'jsx'|'ts'|'tsx'} */ ( moduleType )
				);
				return code && { code };
			},
		},
	};
}
