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
 * It also patches React DOM's boolean-attribute handling for `inert`. React 18
 * treated `inert` as a string attribute, so legacy code commonly passes a string
 * value (e.g. `inert="inert"`). React 19 treats it as a boolean, so the codemod
 * coerces any string `inert` value to `true` in the `case 'inert'` of the
 * attribute-setting switch.
 *
 * A third React DOM patch restores `defaultProps` for the component inside a
 * `memo()` wrapper. React 18 resolved those in `updateMemoComponent`, not at
 * element creation, so the codemod puts them back in the same place.
 *
 * Both patches also emit a one-time `console.warn` (prefixed
 * `[wordpress-react-19]`) when their compatibility path is exercised at runtime:
 * once when a legacy element is encountered, and once when an empty-string
 * `inert` value is coerced. A small compatibility-warning helper is prepended to
 * every patched bundle to back these warnings.
 *
 * Edits are applied to the original source with `magic-string`, so the output
 * is byte-for-byte identical except at the patched locations (handy for
 * diffing against the unpatched `-orig` files).
 */
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import MagicString from 'magic-string';

// Interop for @babel/traverse's default export across CJS/ESM.
const traverse = _traverse.default ?? _traverse;

const TRANSITIONAL_SYMBOL = 'react.transitional.element';
const LEGACY_SYMBOL = 'react.element';
const DEFAULT_LEGACY_NAME = 'REACT_LEGACY_ELEMENT_TYPE';

// Name of the compatibility-warning helper injected into patched bundles. The
// patches call it to surface compatibility behaviour (legacy elements, string
// `inert`) at runtime, warning at most once per `key`.
const WARN_HELPER_NAME = '__wpWarnCompat';

// Name of the helper that resolves the `defaultProps` of the component inside a
// `memo()` wrapper, injected into bundles that {@link patchMemoDefaultProps}
// touches.
const RESOLVE_MEMO_HELPER_NAME = '__wpResolveMemoDefaultProps';

// Warning ids. Each id warns at most once; call sites pass only the id and the
// message is looked up from the table embedded in the injected helper.
const LEGACY_ELEMENT_WARNING = 'legacy-element';
const INERT_WARNING = 'inert';
const MEMO_DEFAULT_PROPS_WARNING = 'memo-default-props';

// Warning messages keyed by id. Embedded once into the patched bundle by the
// injected helper, so call sites never repeat the message text. The
// `[wordpress-react-19]` prefix is added by the helper at runtime.
const WARNING_MESSAGES = {
	[ LEGACY_ELEMENT_WARNING ]:
		'A React element created by an older React runtime (React 17/18) was detected and is handled by a compatibility patch. This usually means a bundled package ships its own React; align it with React 19.',
	[ INERT_WARNING ]:
		'An empty-string `inert` attribute was used. React 19 treats `inert` as a boolean, so the value was coerced to `true` by a compatibility patch. Pass `inert={true}` instead.',
	[ MEMO_DEFAULT_PROPS_WARNING ]:
		'`defaultProps` on a component wrapped in `memo()` was removed in React 19 and is restored by a compatibility patch. Use default parameters instead.',
};

/**
 * Source for the compatibility-warning helper that {@link injectHelpers}
 * inserts into every patched bundle. It is a plain function declaration so it
 * hoists to the top of the enclosing scope and is reachable from the patched
 * call sites via closure. Call sites pass only a warning id; the message table
 * is embedded here once. Warnings are deduplicated per id and prefixed with
 * `[wordpress-react-19]`.
 *
 * @return {string} Helper source code.
 */
function warnHelperSource() {
	return (
		`function ${ WARN_HELPER_NAME }(key) {` +
		`var w = ${ WARN_HELPER_NAME }.warned || (${ WARN_HELPER_NAME }.warned = {});` +
		`if (w[key]) return;` +
		`w[key] = true;` +
		`var messages = ${ JSON.stringify( WARNING_MESSAGES ) };` +
		`if (typeof console !== "undefined" && console.warn) {` +
		`console.warn("[wordpress-react-19] " + messages[key]);` +
		`}` +
		`}\n`
	);
}

/**
 * Source for the helper that resolves `defaultProps` declared on the component
 * inside a `memo()` wrapper. It mirrors React 18's
 * `resolveDefaultPropsOnNonClassComponent`, which React 19 compiles away.
 *
 * @return {string} Helper source code.
 */
function resolveMemoHelperSource() {
	return (
		`function ${ RESOLVE_MEMO_HELPER_NAME }(type, props) {` +
		`var defaultProps = type && type.defaultProps;` +
		`if (!defaultProps) return props;` +
		`${ WARN_HELPER_NAME }("${ MEMO_DEFAULT_PROPS_WARNING }");` +
		`var resolved = Object.assign({}, props);` +
		`for (var name in defaultProps) {` +
		`if (resolved[name] === undefined) resolved[name] = defaultProps[name];` +
		`}` +
		`return resolved;` +
		`}\n`
	);
}

/**
 * Extracts the immediately-invoked function expression (IIFE) from a top-level
 * statement, if it is one. Handles esbuild's `var Global = (() => { … })();`
 * output as well as bare `(function () { … })();` expression statements.
 *
 * @param {Object} statement AST statement node.
 * @return {Object|undefined} The IIFE function node (arrow/function expression).
 */
function getIifeFunction( statement ) {
	let expression;
	if (
		statement.type === 'VariableDeclaration' &&
		statement.declarations.length === 1
	) {
		expression = statement.declarations[ 0 ].init;
	} else if ( statement.type === 'ExpressionStatement' ) {
		expression = statement.expression;
		// `!function(){}()` and similar minifier wrappers.
		if ( expression.type === 'UnaryExpression' ) {
			expression = expression.argument;
		}
	}

	if ( ! expression || expression.type !== 'CallExpression' ) {
		return undefined;
	}

	const callee = expression.callee;
	if (
		( callee.type === 'ArrowFunctionExpression' ||
			callee.type === 'FunctionExpression' ) &&
		callee.body.type === 'BlockStatement'
	) {
		return callee;
	}

	return undefined;
}

/**
 * Inserts the compatibility helpers at the start of the bundle's IIFE body, so
 * they stay scoped to the bundle instead of leaking globals (these bundles run
 * as classic scripts). They are reachable from the patched call sites deeper in
 * the same IIFE via closure.
 *
 * Falls back to prepending at the top of the file when no top-level IIFE is
 * found, which keeps the helpers available regardless of the bundle shape.
 *
 * @param {Object}      ast    Parsed AST (File node).
 * @param {MagicString} ms     Magic string for the source being edited.
 * @param {string}      source Helper source code to insert.
 */
function injectHelpers( ast, ms, source ) {
	for ( const statement of ast.program.body ) {
		const iife = getIifeFunction( statement );
		if ( iife ) {
			// `body.start` is the opening `{`; insert right after it.
			ms.appendRight( iife.body.start + 1, `\n${ source }` );
			return;
		}
	}

	ms.prepend( source );
}

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
			`[react-patch] Could not resolve the binding for \`${ transitionalName }\` in ${ filename }.`
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

	// `case TRANSITIONAL:` -> add a fall-through `case LEGACY:` before it, with a
	// warning that runs only when a legacy element actually reaches this case
	// (the warning sits between the two labels, so the transitional case skips
	// it and falls straight into the original body).
	if ( parent.type === 'SwitchCase' && parent.test === node ) {
		ms.appendLeft(
			parent.start,
			`case ${ legacyName }: ${ WARN_HELPER_NAME }("${ LEGACY_ELEMENT_WARNING }"); `
		);
		return;
	}

	// `a === TRANSITIONAL` -> `( a === TRANSITIONAL || ( a === LEGACY && warn ) )`.
	// The warning only fires when the legacy branch matches.
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
			`(${ original } || (${ otherText } === ${ legacyName } && (${ WARN_HELPER_NAME }("${ LEGACY_ELEMENT_WARNING }"), true)))`
		);
		return;
	}

	const location = node.loc
		? `:${ node.loc.start.line }:${ node.loc.start.column + 1 }`
		: '';
	throw new Error(
		`[react-patch] Unsupported use of the React element-type symbol in ${ filename }${ location }. ` +
			'Only `case` labels and `===` comparisons are handled.'
	);
}

/**
 * Whether a node is a `<object>.props.ref` member expression.
 *
 * @param {Object} node AST node.
 * @return {boolean} True when the node matches.
 */
function isPropsRefMember( node ) {
	return (
		!! node &&
		node.type === 'MemberExpression' &&
		! node.computed &&
		node.property.type === 'Identifier' &&
		node.property.name === 'ref' &&
		node.object.type === 'MemberExpression' &&
		! node.object.computed &&
		node.object.property.type === 'Identifier' &&
		node.object.property.name === 'props'
	);
}

/**
 * Returns the `<object>.props.ref` member expression when the statement is an
 * assignment of the form `x = y.props.ref` (or `var x = y.props.ref`).
 *
 * @param {Object} statement AST statement node.
 * @return {Object|undefined} The `props.ref` member expression, if matched.
 */
function getPropsRefAssignment( statement ) {
	if ( ! statement ) {
		return undefined;
	}
	if ( statement.type === 'ExpressionStatement' ) {
		let expression = statement.expression;
		// Minifiers join consecutive statements into a single comma sequence;
		// the "first statement" is then the first expression of the sequence.
		if ( expression.type === 'SequenceExpression' ) {
			expression = expression.expressions[ 0 ];
		}
		if (
			expression.type === 'AssignmentExpression' &&
			expression.operator === '=' &&
			isPropsRefMember( expression.right )
		) {
			return expression.right;
		}
		return undefined;
	}
	if (
		statement.type === 'VariableDeclaration' &&
		statement.declarations.length === 1 &&
		isPropsRefMember( statement.declarations[ 0 ].init )
	) {
		return statement.declarations[ 0 ].init;
	}
	return undefined;
}

/**
 * Patches React DOM's `coerceRef` so it falls back to the legacy
 * `element.ref` when `element.props.ref` is absent. Elements created by older
 * React runtimes keep the ref on the element itself instead of in props.
 *
 * `coerceRef` is identified structurally: its first body statement assigns
 * `<id>.props.ref` (e.g. `t = t.props.ref`). This runs only on the React DOM
 * bundle, where exactly one such function is expected, so anything other than a
 * single match is treated as an error since the assumption no longer holds.
 *
 * @param {Object}      ast      Parsed AST (File node).
 * @param {MagicString} ms       Magic string for the source being edited.
 * @param {string}      filename Source name, for error messages.
 */
function patchCoerceRef( ast, ms, filename ) {
	const matches = [];

	traverse( ast, {
		Function( path ) {
			const body = path.node.body;
			if (
				! body ||
				body.type !== 'BlockStatement' ||
				body.body.length === 0
			) {
				return;
			}
			const propsRef = getPropsRefAssignment( body.body[ 0 ] );
			if ( propsRef ) {
				matches.push( propsRef );
			}
		},
	} );

	if ( matches.length !== 1 ) {
		throw new Error(
			`[react-patch] Expected exactly one \`coerceRef\`-like function (first statement \`x = y.props.ref\`) in ${ filename }, found ${ matches.length }.`
		);
	}

	const propsRef = matches[ 0 ];
	const object = propsRef.object.object;
	const propsRefText = ms.original.slice( propsRef.start, propsRef.end );
	const objectText = ms.original.slice( object.start, object.end );
	ms.overwrite(
		propsRef.start,
		propsRef.end,
		`(${ propsRefText } ?? ${ objectText }.ref)`
	);
}

/**
 * Patches every `Symbol.for('react.transitional.element')` variable so that
 * checks against it also accept the legacy `Symbol.for('react.element')`.
 *
 * @param {Object}      ast      Parsed AST (File node).
 * @param {MagicString} ms       Magic string for the source being edited.
 * @param {string}      filename Source name, for error messages.
 */
function patchTransitionalSymbols( ast, ms, filename ) {
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
			`[react-patch] No \`Symbol.for('${ TRANSITIONAL_SYMBOL }')\` assignment found in ${ filename }.`
		);
	}

	for ( const declPath of declarators ) {
		patchTransitionalDeclarator( declPath, ms, filename );
	}
}

/**
 * When `statement` is the shared boolean-attribute handler of React DOM's
 * attribute-setting switch, returns the identifier holding the attribute value.
 *
 * The handler has the shape:
 *
 *   value && "function" !== typeof value && "symbol" !== typeof value
 *     ? domElement.setAttribute( key, "" )
 *     : domElement.removeAttribute( key );
 *
 * @param {Object} statement AST statement node.
 * @return {Object|undefined} The value Identifier node, if matched.
 */
function getBooleanAttributeValueId( statement ) {
	if ( ! statement || statement.type !== 'ExpressionStatement' ) {
		return undefined;
	}
	const expression = statement.expression;
	if ( expression.type !== 'ConditionalExpression' ) {
		return undefined;
	}

	const { consequent, alternate } = expression;
	const isCallTo = ( node, method ) =>
		node.type === 'CallExpression' &&
		node.callee.type === 'MemberExpression' &&
		! node.callee.computed &&
		node.callee.property.type === 'Identifier' &&
		node.callee.property.name === method;

	const setsEmptyAttribute =
		isCallTo( consequent, 'setAttribute' ) &&
		consequent.arguments.length === 2 &&
		consequent.arguments[ 1 ].type === 'StringLiteral' &&
		consequent.arguments[ 1 ].value === '';
	if ( ! setsEmptyAttribute || ! isCallTo( alternate, 'removeAttribute' ) ) {
		return undefined;
	}

	// The value is the leftmost operand of the `value && …` test.
	let test = expression.test;
	while ( test.type === 'LogicalExpression' ) {
		test = test.left;
	}
	return test.type === 'Identifier' ? test : undefined;
}

/**
 * Patches the `case 'inert'` of React DOM's attribute-setting switch so any
 * string value is coerced to `true` before the boolean-attribute handler runs.
 *
 * React 18 treated `inert` as a string attribute (e.g. `inert="inert"`), while
 * React 19 treats it as a boolean. Without this patch a legacy string value
 * would not behave like the boolean `true` it was meant to represent.
 *
 * The target switch is identified structurally: a `case 'inert'` that falls
 * through to the boolean-attribute handler (`value ? setAttribute(key, "") :
 * removeAttribute(key)`). Exactly one such switch is expected, so anything other
 * than a single match is treated as an error.
 *
 * @param {Object}      ast      Parsed AST (File node).
 * @param {MagicString} ms       Magic string for the source being edited.
 * @param {string}      filename Source name, for error messages.
 */
function patchInertAttribute( ast, ms, filename ) {
	const matches = [];

	traverse( ast, {
		SwitchStatement( path ) {
			const cases = path.node.cases;
			const inertIndex = cases.findIndex(
				( switchCase ) =>
					switchCase.test &&
					switchCase.test.type === 'StringLiteral' &&
					switchCase.test.value === 'inert'
			);
			if ( inertIndex === -1 ) {
				return;
			}

			// Walk forward from `case 'inert'` (through the empty fall-through
			// cases) to the shared boolean-attribute handler, and grab the
			// variable holding the attribute value.
			let valueName;
			for ( let i = inertIndex; i < cases.length && ! valueName; i++ ) {
				for ( const statement of cases[ i ].consequent ) {
					const valueId = getBooleanAttributeValueId( statement );
					if ( valueId ) {
						valueName = valueId.name;
						break;
					}
				}
			}
			if ( ! valueName ) {
				return;
			}

			matches.push( { inertCase: cases[ inertIndex ], valueName } );
		},
	} );

	if ( matches.length !== 1 ) {
		throw new Error(
			`[react-patch] Expected exactly one boolean-attribute \`case 'inert'\` switch in ${ filename }, found ${ matches.length }.`
		);
	}

	const { inertCase, valueName } = matches[ 0 ];
	// Append at the end of the `inert` case body (right before the fall-through).
	// `SwitchCase.end` is the end of the last consequent statement, or just after
	// the `case 'inert':` label when the body is empty.
	//
	// The empty-string warning is appended first so it still sees the original
	// value, then the coercion of any string `inert` value to `true`.
	ms.appendLeft(
		inertCase.end,
		` if ( "" === ${ valueName } ) ${ WARN_HELPER_NAME }("${ INERT_WARNING }"); `
	);
	ms.appendLeft(
		inertCase.end,
		` if ( "string" === typeof ${ valueName } ) ${ valueName } = true; `
	);
}

/**
 * Returns the object of a `<object>.<property> === <value>` comparison, in
 * either operand order.
 *
 * @param {Object}                      node     AST node.
 * @param {string}                      property Property name to match.
 * @param {( node: Object ) => boolean} isValue  Predicate for the compared value.
 * @return {Object|undefined} The object the property was read from, if matched.
 */
function getComparedMemberObject( node, property, isValue ) {
	if (
		! node ||
		node.type !== 'BinaryExpression' ||
		node.operator !== '==='
	) {
		return undefined;
	}

	for ( const [ member, value ] of [
		[ node.left, node.right ],
		[ node.right, node.left ],
	] ) {
		if (
			member.type === 'MemberExpression' &&
			! member.computed &&
			member.property.type === 'Identifier' &&
			member.property.name === property &&
			isValue( value )
		) {
			return member.object;
		}
	}

	return undefined;
}

/**
 * Flattens an `&&` chain into its operands.
 *
 * @param {Object}   node     AST node.
 * @param {Object[]} operands Accumulator.
 * @return {Object[]} The operands of the chain.
 */
function flattenLogicalAnd( node, operands = [] ) {
	if ( node.type === 'LogicalExpression' && node.operator === '&&' ) {
		flattenLogicalAnd( node.left, operands );
		flattenLogicalAnd( node.right, operands );
	} else {
		operands.push( node );
	}
	return operands;
}

const isUndefinedValue = ( node ) =>
	( node.type === 'UnaryExpression' && node.operator === 'void' ) ||
	( node.type === 'Identifier' && node.name === 'undefined' );

const isNullValue = ( node ) => node.type === 'NullLiteral';

/**
 * Restores `defaultProps` for the component inside a `memo()` wrapper.
 *
 * React 18 resolved these in the reconciler rather than at element creation:
 * `beginWork`'s `MemoComponent` case resolved the wrapper's own `defaultProps`
 * and then the inner component's before calling `updateMemoComponent`. React 19
 * compiles both away, and the wrapper object that `createElement` and `jsx` see
 * carries no `defaultProps` of its own, so patching element creation would miss
 * every memo element built by a bundled React 17/18 runtime. Patching the
 * reconciler catches them all.
 *
 * Only the inner resolution is restored. The wrapper's own `defaultProps` are
 * still applied by React 19's `createElement`, and by the `jsx` shim in
 * `tools/react-19`.
 *
 * `updateMemoComponent` is identified structurally, by the test that decides
 * whether the memo can be upgraded to a `SimpleMemoComponent`: it is the only
 * place that checks `<type>.defaultProps === undefined` and
 * `<component>.compare === null` together. Exactly one such function is
 * expected, so anything else is treated as an error.
 *
 * @param {Object}      ast      Parsed AST (File node).
 * @param {MagicString} ms       Magic string for the source being edited.
 * @param {string}      filename Source name, for error messages.
 * @param {Set<string>} helpers  Helper sources to inject into the bundle.
 */
function patchMemoDefaultProps( ast, ms, filename, helpers ) {
	const matches = [];

	traverse( ast, {
		LogicalExpression( path ) {
			// Only inspect the outermost `&&` chain, so a chain is not matched
			// once per nested `LogicalExpression`.
			if (
				path.node.operator !== '&&' ||
				( path.parent.type === 'LogicalExpression' &&
					path.parent.operator === '&&' )
			) {
				return;
			}

			let componentName;
			let checksDefaultProps = false;
			for ( const operand of flattenLogicalAnd( path.node ) ) {
				if (
					getComparedMemberObject(
						operand,
						'defaultProps',
						isUndefinedValue
					)
				) {
					checksDefaultProps = true;
				}
				const component = getComparedMemberObject(
					operand,
					'compare',
					isNullValue
				);
				if ( component?.type === 'Identifier' ) {
					componentName = component.name;
				}
			}

			if ( ! checksDefaultProps || ! componentName ) {
				return;
			}

			const fn = path.getFunctionParent();
			if ( fn && fn.node.body.type === 'BlockStatement' ) {
				matches.push( { fn: fn.node, componentName } );
			}
		},
	} );

	if ( matches.length !== 1 ) {
		throw new Error(
			`[react-patch] Expected exactly one \`updateMemoComponent\`-like function (testing \`defaultProps === undefined\` and \`compare === null\`) in ${ filename }, found ${ matches.length }.`
		);
	}

	// `updateMemoComponent( current, workInProgress, Component, nextProps, … )`:
	// the props to resolve are the parameter after the memo wrapper.
	const { fn, componentName } = matches[ 0 ];
	const componentIndex = fn.params.findIndex(
		( param ) => param.type === 'Identifier' && param.name === componentName
	);
	const propsParam = fn.params[ componentIndex + 1 ];
	if ( componentIndex === -1 || propsParam?.type !== 'Identifier' ) {
		throw new Error(
			`[react-patch] Could not locate the props parameter following \`${ componentName }\` in ${ filename }.`
		);
	}

	helpers.add( resolveMemoHelperSource() );

	// Resolving at the top of the function covers both the mount and the update
	// branch, and `lazy( memo( … ) )`, which routes through here too.
	ms.appendRight(
		fn.body.start + 1,
		`${ propsParam.name } = ${ RESOLVE_MEMO_HELPER_NAME }(${ componentName }.type, ${ propsParam.name });`
	);
}

/**
 * A patch pass operates on a shared AST and `magic-string` for a single source,
 * and may add to the set of helper sources injected into the bundle.
 *
 * @typedef {( ast: Object, ms: MagicString, filename: string, helpers: Set< string > ) => void} PatchPass
 */

/**
 * Composes patch passes into a single patcher that parses the source once,
 * applies every pass to the shared AST/`magic-string`, and returns the result.
 *
 * Bundles select which passes apply: the `react` core bundle only needs
 * {@link patchTransitionalSymbols}, while the `react-dom` bundle additionally
 * needs the DOM-only {@link patchCoerceRef} and {@link patchInertAttribute}.
 *
 * @param {...PatchPass} passes Patch passes to apply, in order.
 * @return {( code: string, filename?: string ) => string} The composed patcher.
 */
export function createPatcher( ...passes ) {
	return ( code, filename = 'input.js' ) => {
		const ast = parse( code, { sourceType: 'unambiguous' } );
		const ms = new MagicString( code );
		const helpers = new Set( [ warnHelperSource() ] );

		for ( const pass of passes ) {
			pass( ast, ms, filename, helpers );
		}

		// Inject the helpers that the patches call at runtime. They are hoisted
		// function declarations, so they are reachable from the patched call
		// sites (inside the bundle's IIFE) via closure.
		injectHelpers( ast, ms, [ ...helpers ].join( '' ) );

		return ms.toString();
	};
}

export {
	patchTransitionalSymbols,
	patchCoerceRef,
	patchInertAttribute,
	patchMemoDefaultProps,
};
