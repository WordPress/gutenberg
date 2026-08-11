/**
 * Shared utilities for SSR-safety rules that prevent DOM global usage in
 * unsafe contexts.
 *
 * These rules replace the unmaintained `eslint-plugin-ssr-friendly` package.
 */

const { browser: browserGlobals, node: nodeGlobals } = require( 'globals' );

/**
 * Returns true if the given name is a browser-only DOM global (exists in
 * browser globals but not in node globals).
 *
 * @param {string} name Identifier name to check.
 * @return {boolean} Whether the name is a DOM-only global.
 */
function isDOMGlobal( name ) {
	return name in browserGlobals && ! ( name in nodeGlobals );
}

/**
 * Returns true if the given scope's block returns JSX (heuristic for
 * detecting React render functions).
 *
 * @param {import('eslint').Scope.Scope} scope Scope to check.
 * @return {boolean} Whether the scope returns JSX.
 */
function isReturnValueJSX( scope ) {
	if ( scope.type !== 'function' ) {
		return false;
	}

	const { block } = scope;

	// Concise arrow function: const C = () => <div />
	if (
		block.type === 'ArrowFunctionExpression' &&
		block.body.type !== 'BlockStatement'
	) {
		return (
			block.body.type === 'JSXElement' ||
			block.body.type === 'JSXFragment'
		);
	}

	const body = block?.body?.body;
	if ( ! body || typeof body.find !== 'function' ) {
		return false;
	}

	return body.some(
		( statement ) =>
			statement?.type === 'ReturnStatement' &&
			statement.argument &&
			( statement.argument.type === 'JSXElement' ||
				statement.argument.type === 'JSXFragment' )
	);
}

/**
 * Returns true if the reference's identifier should be skipped from
 * reporting. Allows `typeof <global>` checks and TypeScript type references.
 *
 * @param {import('eslint').Scope.Reference} reference Variable reference.
 * @return {boolean} Whether the reference should be skipped.
 */
function shouldSkipReference( reference ) {
	const { parent } = reference.identifier;
	return (
		( parent.type === 'UnaryExpression' && parent.operator === 'typeof' ) ||
		parent.type === 'TSTypeReference' ||
		parent.type === 'TSInterfaceHeritage' ||
		parent.type === 'TSTypeQuery' ||
		parent.type === 'TSQualifiedName'
	);
}

/**
 * Creates an ESLint rule that reports DOM global usage based on a scope
 * predicate.
 *
 * @param {Object}                                           options             Rule options.
 * @param {string}                                           options.description Rule description.
 * @param {string}                                           options.message     Error message template (use {{name}} for the global name).
 * @param {(scope: import('eslint').Scope.Scope) => boolean} options.test        Predicate that receives the reference's scope and
 *                                                                               returns true if usage should be reported.
 * @return {import('eslint').Rule.RuleModule} ESLint rule module.
 */
function createDOMGlobalRule( { description, message, test } ) {
	return {
		meta: {
			type: 'problem',
			schema: [],
			docs: {
				description,
			},
			messages: {
				defaultMessage: message,
			},
		},
		create( context ) {
			return {
				Program( node ) {
					const scope = context.sourceCode.getScope( node );

					// Report variables declared elsewhere (e.g. variables
					// defined as "global" by eslint).
					for ( const variable of scope.variables ) {
						if (
							variable.defs.length === 0 &&
							isDOMGlobal( variable.name )
						) {
							for ( const reference of variable.references ) {
								if (
									! shouldSkipReference( reference ) &&
									test( reference.from )
								) {
									context.report( {
										node: reference.identifier,
										messageId: 'defaultMessage',
										data: {
											name: reference.identifier.name,
										},
									} );
								}
							}
						}
					}

					// Report variables not declared at all.
					for ( const reference of scope.through ) {
						if (
							isDOMGlobal( reference.identifier.name ) &&
							! shouldSkipReference( reference ) &&
							test( reference.from )
						) {
							context.report( {
								node: reference.identifier,
								messageId: 'defaultMessage',
								data: {
									name: reference.identifier.name,
								},
							} );
						}
					}
				},
			};
		},
	};
}

module.exports = {
	isDOMGlobal,
	isReturnValueJSX,
	shouldSkipReference,
	createDOMGlobalRule,
};
