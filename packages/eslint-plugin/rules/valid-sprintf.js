const {
	getTranslateFunctionName,
	getTranslateFunctionArgs,
	getTextContentFromNode,
} = require( '../utils' );
const {
	getSprintfPlaceholders,
	getSprintfArgumentPositions,
} = require( '../utils/get-sprintf-placeholders' );

/**
 * Returns the number of arguments passed to sprintf after the format string,
 * or `null` if it cannot be known.
 *
 * A single array literal is used as the list of arguments, as in
 * `sprintf( format, [ a, b ] )`. Any other single argument, such as a
 * variable, counts as one value: passing an array variable is rare, and a
 * forgotten argument usually looks like `sprintf( format, value )`.
 *
 * @param {Object[]} args Argument nodes after the format string.
 *
 * @return {?number} Number of arguments.
 */
function getArgumentCount( args ) {
	if ( args.some( ( arg ) => arg.type === 'SpreadElement' ) ) {
		return null;
	}

	if ( args.length === 1 && args[ 0 ].type === 'ArrayExpression' ) {
		const { elements } = args[ 0 ];
		return elements.some(
			( element ) => ! element || element.type === 'SpreadElement'
		)
			? null
			: elements.length;
	}

	return args.length;
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noFormatString: 'sprintf must be called with a format string',
			invalidFormatString:
				'sprintf must be called with a valid format string',
			noPlaceholderArgs:
				'sprintf must be called with placeholder value argument(s)',
			noPlaceholders:
				'sprintf format string must contain at least one placeholder',
			placeholderMismatch:
				'sprintf format string options must have the same number of placeholders',
			noOrderedPlaceholders:
				'Multiple sprintf placeholders should be ordered. Mix of ordered and non-ordered placeholders found.',
			argumentCountMismatch:
				'sprintf format string expects {{ expected }} placeholder value argument(s), but {{ actual }} given',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName =
					callee.property && callee.property.name
						? callee.property.name
						: callee.name;

				if ( functionName !== 'sprintf' ) {
					return;
				}

				if ( ! args.length ) {
					context.report( {
						node,
						messageId: 'noFormatString',
					} );
					return;
				}

				if ( args.length < 2 ) {
					if ( args[ 0 ].type === 'SpreadElement' ) {
						return;
					}

					context.report( {
						node,
						messageId: 'noPlaceholderArgs',
					} );
					return;
				}

				let candidates;
				let isTranslation = false;
				switch ( args[ 0 ].type ) {
					case 'Literal':
						candidates = [ args[ 0 ].value ].filter( ( arg ) => {
							// Since a Literal may be a number, verify the
							// value is a string.
							return typeof arg === 'string';
						} );
						break;

					case 'CallExpression':
						isTranslation = true;
						const argFunctionName = getTranslateFunctionName(
							args[ 0 ].callee
						);

						// All possible options (arguments) from a translate
						// function must be valid.
						candidates = getTranslateFunctionArgs(
							argFunctionName,
							args[ 0 ].arguments,
							false
						).map( getTextContentFromNode );

						// An unknown function call may produce a valid string
						// value. Ideally its result is verified, but this is
						// not straight-forward to implement. Thus, bail.
						if ( candidates.filter( Boolean ).length === 0 ) {
							return;
						}

						break;

					case 'Identifier':
						// Identifiers may refer to a valid string variable.
						// Ideally its reference value is verified, but this is
						// not straight-forward to implement. Thus, bail.
						return;

					default:
						candidates = [];
				}

				if ( ! candidates.length ) {
					context.report( {
						node,
						messageId: 'invalidFormatString',
					} );
					return;
				}

				// A translation function argument that is not a string, such
				// as a variable, may hold any format string. Thus, bail.
				if (
					candidates.some(
						( candidate ) => typeof candidate !== 'string'
					)
				) {
					return;
				}

				const placeholderLists = candidates.map(
					getSprintfPlaceholders
				);

				// Prioritize placeholder number consistency over matching
				// placeholder, since it's a more common error to omit a
				// placeholder from the singular form of pluralization.
				if (
					placeholderLists.some(
						( placeholders ) =>
							placeholders.length !== placeholderLists[ 0 ].length
					)
				) {
					context.report( {
						node,
						messageId: 'placeholderMismatch',
					} );
					return;
				}

				for ( const placeholders of placeholderLists ) {
					// `i18n-ordered-placeholders` reports unordered
					// placeholders in translatable strings, wherever they
					// are used.
					if (
						! isTranslation &&
						placeholders.some( ( { isOrdered } ) => isOrdered ) &&
						placeholders.some( ( { isOrdered } ) => ! isOrdered )
					) {
						context.report( {
							node,
							messageId: 'noOrderedPlaceholders',
						} );
						return;
					}

					// Catch strings without placeholders, including strings
					// that only contain escaped percent signs (`%%`).
					if ( ! placeholders.length ) {
						context.report( {
							node,
							messageId: 'noPlaceholders',
						} );
						return;
					}
				}

				const actual = getArgumentCount( args.slice( 1 ) );

				if ( actual === null ) {
					return;
				}

				const requiredCounts = placeholderLists.map(
					( placeholders ) =>
						getSprintfArgumentPositions( placeholders )
							.requiredArgumentCount
				);

				// Named placeholders read properties of a single object
				// argument, so the number of arguments says nothing.
				if ( requiredCounts.includes( null ) ) {
					return;
				}

				const expected = Math.max( ...requiredCounts );

				if ( actual !== expected ) {
					context.report( {
						node,
						messageId: 'argumentCountMismatch',
						data: { expected, actual },
					} );
				}
			},
		};
	},
};
