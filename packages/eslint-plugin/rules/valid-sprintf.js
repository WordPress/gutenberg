/**
 * Internal dependencies
 */
const {
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
	getTextContentFromNode,
} = require( '../utils' );

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
				switch ( args[ 0 ].type ) {
					case 'Literal':
						candidates = [ args[ 0 ].value ].filter( ( arg ) => {
							// Since a Literal may be a number, verify the
							// value is a string.
							return typeof arg === 'string';
						} );
						break;

					case 'CallExpression':
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

					if (
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
			},
		};
	},
};
