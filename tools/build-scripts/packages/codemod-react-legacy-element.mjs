/**
 * Codemod that teaches a bundled React 19 script to also accept "legacy"
 * elements created by older React runtimes (React 17/18), which tag elements
 * with `Symbol.for( 'react.element' )` instead of React 19's
 * `Symbol.for( 'react.transitional.element' )`.
 *
 * The transformation:
 *
 *   1. Find the variable assigned `Symbol.for( 'react.transitional.element' )`.
 *   2. Ensure a sibling variable holding `Symbol.for( 'react.element' )` exists
 *      (reuse an existing one declared right before it, otherwise create
 *      `REACT_LEGACY_ELEMENT_TYPE`).
 *   3. Rewrite every reference to the transitional variable:
 *        - `case TRANSITIONAL:`        -> `case LEGACY: case TRANSITIONAL:`
 *        - `a === TRANSITIONAL`        -> `( a === TRANSITIONAL || a === LEGACY )`
 *      Any other usage throws, since it is not known to be safe.
 *
 * Edits are applied to the original source with `magic-string`, so the output
 * is byte-for-byte identical except at the patched locations (handy for
 * diffing against the unpatched `-orig` files).
 */

/**
 * External dependencies
 */
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import MagicString from 'magic-string';

// Interop for @babel/traverse's default export across CJS/ESM.
const traverse = _traverse.default ?? _traverse;

const TRANSITIONAL_SYMBOL = 'react.transitional.element';
const LEGACY_SYMBOL = 'react.element';
const DEFAULT_LEGACY_NAME = 'REACT_LEGACY_ELEMENT_TYPE';

/**
 * Whether a node is a `Symbol.for( '<value>' )` call.
 *
 * @param {Object} node  AST node.
 * @param {string} value Expected string argument.
 * @return {boolean} True when the node matches.
 */
function isSymbolForCall( node, value ) {
	return (
		!! node &&
		node.type === 'CallExpression' &&
		node.callee.type === 'MemberExpression' &&
		! node.callee.computed &&
		node.callee.object.type === 'Identifier' &&
		node.callee.object.name === 'Symbol' &&
		node.callee.property.type === 'Identifier' &&
		node.callee.property.name === 'for' &&
		node.arguments.length === 1 &&
		node.arguments[ 0 ].type === 'StringLiteral' &&
		node.arguments[ 0 ].value === value
	);
}

/**
 * Patches a single transitional-element declarator and its references.
 *
 * @param {Object}      declPath VariableDeclarator NodePath for the transitional symbol.
 * @param {MagicString} ms       Magic string for the source being edited.
 * @param {string}      filename Source name, for error messages.
 */
function patchTransitionalDeclarator( declPath, ms, filename ) {
	const declarator = declPath.node;
	const transitionalName = declarator.id.name;
	const { scope } = declPath;

	// Reuse a legacy symbol declared immediately before the transitional one,
	// otherwise create a fresh declarator right before it.
	const declaration = declPath.parentPath.node;
	const index = declaration.declarations.indexOf( declarator );
	const previous =
		index > 0 ? declaration.declarations[ index - 1 ] : undefined;

	let legacyName;
	if ( previous && isSymbolForCall( previous.init, LEGACY_SYMBOL ) ) {
		legacyName = previous.id.name;
	} else {
		legacyName = scope.hasBinding( DEFAULT_LEGACY_NAME )
			? scope.generateUid( DEFAULT_LEGACY_NAME )
			: DEFAULT_LEGACY_NAME;
		ms.appendLeft(
			declarator.start,
			`${ legacyName } = Symbol.for("${ LEGACY_SYMBOL }"), `
		);
	}

	const binding = scope.getBinding( transitionalName );
	if ( ! binding ) {
		throw new Error(
			`[react-legacy-element] Could not resolve the binding for \`${ transitionalName }\` in ${ filename }.`
		);
	}

	for ( const refPath of binding.referencePaths ) {
		patchReference( refPath, legacyName, ms, filename );
	}
}

/**
 * Patches a single reference to the transitional symbol.
 *
 * @param {Object}      refPath    Identifier NodePath referencing the transitional symbol.
 * @param {string}      legacyName Name of the legacy symbol variable.
 * @param {MagicString} ms         Magic string for the source being edited.
 * @param {string}      filename   Source name, for error messages.
 */
function patchReference( refPath, legacyName, ms, filename ) {
	const node = refPath.node;
	const parent = refPath.parent;

	// Element *creation* keeps the transitional symbol, so leave it untouched:
	//   `{ $$typeof: TRANSITIONAL, ... }`
	if (
		parent.type === 'ObjectProperty' &&
		parent.value === node &&
		! parent.computed &&
		( ( parent.key.type === 'Identifier' &&
			parent.key.name === '$$typeof' ) ||
			( parent.key.type === 'StringLiteral' &&
				parent.key.value === '$$typeof' ) )
	) {
		return;
	}

	// Element *creation* via assignment also keeps the transitional symbol:
	//   `element.$$typeof = TRANSITIONAL`
	if (
		parent.type === 'AssignmentExpression' &&
		parent.operator === '=' &&
		parent.right === node &&
		parent.left.type === 'MemberExpression' &&
		! parent.left.computed &&
		parent.left.property.type === 'Identifier' &&
		parent.left.property.name === '$$typeof'
	) {
		return;
	}

	// `case TRANSITIONAL:` -> add a fall-through `case LEGACY:` before it.
	if ( parent.type === 'SwitchCase' && parent.test === node ) {
		ms.appendLeft( parent.start, `case ${ legacyName }: ` );
		return;
	}

	// `a === TRANSITIONAL` -> `( a === TRANSITIONAL || a === LEGACY )`.
	if (
		parent.type === 'BinaryExpression' &&
		parent.operator === '===' &&
		( parent.left === node || parent.right === node )
	) {
		const other = parent.left === node ? parent.right : parent.left;
		const original = ms.original.slice( parent.start, parent.end );
		const otherText = ms.original.slice( other.start, other.end );
		ms.overwrite(
			parent.start,
			parent.end,
			`(${ original } || ${ otherText } === ${ legacyName })`
		);
		return;
	}

	const location = node.loc
		? `:${ node.loc.start.line }:${ node.loc.start.column + 1 }`
		: '';
	throw new Error(
		`[react-legacy-element] Unsupported use of the React element-type symbol in ${ filename }${ location }. ` +
			'Only `case` labels and `===` comparisons are handled.'
	);
}

/**
 * Applies the legacy-element codemod to a bundled React script.
 *
 * @param {string} code     Source code to patch.
 * @param {string} filename Source name, for error messages.
 * @return {string} The patched source code.
 */
export function patchReactLegacyElement( code, filename = 'input.js' ) {
	const ast = parse( code, { sourceType: 'unambiguous' } );
	const ms = new MagicString( code );

	const declarators = [];
	traverse( ast, {
		VariableDeclarator( path ) {
			if ( isSymbolForCall( path.node.init, TRANSITIONAL_SYMBOL ) ) {
				declarators.push( path );
			}
		},
	} );

	if ( declarators.length === 0 ) {
		throw new Error(
			`[react-legacy-element] No \`Symbol.for('${ TRANSITIONAL_SYMBOL }')\` assignment found in ${ filename }.`
		);
	}

	for ( const declPath of declarators ) {
		patchTransitionalDeclarator( declPath, ms, filename );
	}

	return ms.toString();
}
