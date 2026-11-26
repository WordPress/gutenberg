const {
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
	getTextContentFromNode,
} = require( '../utils' );
const {
	getSprintfPlaceholders,
	getSprintfArgumentPositions,
} = require( '../utils/get-sprintf-placeholders' );

/**
 * Node types of a single sprintf argument that cannot be an array. A single
 * array argument is used as the list of arguments, so an argument of any other
 * type, such as a variable, may hold any number of arguments.
 *
 * @type {Set<string>}
 */
const NON_ARRAY_NODE_TYPES = new Set( [
	'Literal',
	'TemplateLiteral',
	'BinaryExpression',
	'UnaryExpression',
	'UpdateExpression',
] );

/**
 * Returns the number of arguments passed to sprintf after the format string,
 * or `null` if it cannot be known.
 *
 * @param {Object[]} args Argument nodes after the format string.
 *
 * @return {?number} Number of arguments.
 */
function getArgumentCount( args ) {
	if ( args.some( ( arg ) => arg.type === 'SpreadElement' ) ) {
		return null;
	}

	if ( args.length === 1 ) {
		if ( args[ 0 ].type === 'ArrayExpression' ) {
			const { elements } = args[ 0 ];
			return elements.some(
				( element ) => ! element || element.type === 'SpreadElement'
			)
				? null
				: elements.length;
		}

		if ( ! NON_ARRAY_NODE_TYPES.has( args[ 0 ].type ) ) {
			return null;
		}
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

				let numPlaceholders;
				for ( const candidate of candidates ) {
					const allMatches = candidate.match(
						REGEXP_SPRINTF_PLACEHOLDER
					);

					// Prioritize placeholder number consistency over matching
					// placeholder, since it's a more common error to omit a
					// placeholder from the singular form of pluralization.
					if (
						numPlaceholders !== undefined &&
						( ! allMatches ||
							numPlaceholders !== allMatches.length )
					) {
						context.report( {
							node,
							messageId: 'placeholderMismatch',
						} );
						return;
					}

					const unorderedMatches = candidate.match(
						REGEXP_SPRINTF_PLACEHOLDER_UNORDERED
					);

					// `i18n-ordered-placeholders` reports unordered
					// placeholders in translatable strings, wherever they
					// are used.
					if (
						! isTranslation &&
						unorderedMatches &&
						allMatches &&
						unorderedMatches.length > 0 &&
						allMatches.length > 1 &&
						unorderedMatches.length !== allMatches.length
					) {
						context.report( {
							node,
							messageId: 'noOrderedPlaceholders',
						} );
						return;
					}

					// Catch cases where a string only contains %% (escaped percentage sign).
					if (
						! allMatches ||
						( allMatches.length === 1 && allMatches[ 0 ] === '%%' )
					) {
						context.report( {
							node,
							messageId: 'noPlaceholders',
						} );
						return;
					}

					if ( numPlaceholders === undefined ) {
						// Track the number of placeholders discovered in the
						// string to verify that all other candidate options
						// have the same number.
						numPlaceholders = allMatches.length;
					}
				}

				const actual = getArgumentCount( args.slice( 1 ) );

				if (
					actual === null ||
					candidates.some(
						( candidate ) => typeof candidate !== 'string'
					)
				) {
					return;
				}

				const requiredCounts = candidates.map(
					( candidate ) =>
						getSprintfArgumentPositions(
							getSprintfPlaceholders( candidate )
						).requiredArgumentCount
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
