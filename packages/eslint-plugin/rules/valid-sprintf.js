/**
 * Internal dependencies
 */
const {
	REGEXP_PLACEHOLDER,
	getTranslateFunctionArgs,
	getTextContentFromNode,
} = require( '../utils' );

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;
				if ( callee.name !== 'sprintf' ) {
					return;
				}

				if ( ! args.length ) {
					context.report(
						node,
						'sprintf must be called with a format string'
					);
					return;
				}

				if ( args.length < 2 ) {
					context.report(
						node,
						'sprintf must be called with placeholder value argument(s)'
					);
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
						// All possible options (arguments) from a translate
						// function must be valid.
						candidates = getTranslateFunctionArgs(
							args[ 0 ].callee.name,
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
					context.report(
						node,
						'sprintf must be called with a valid format string'
					);
					return;
				}

				let numPlaceholders;
				for ( let i = 0; i < candidates.length; i++ ) {
					const match = candidates[ i ].match( REGEXP_PLACEHOLDER );

					// Prioritize placeholder number consistency over matching
					// placeholder, since it's a more common error to omit a
					// placeholder from the singular form of pluralization.
					if (
						numPlaceholders !== undefined &&
						( ! match || numPlaceholders !== match.length )
					) {
						context.report(
							node,
							'sprintf format string options must have the same number of placeholders'
						);
						return;
					}

					if ( ! match ) {
						context.report(
							node,
							'sprintf format string must contain at least one placeholder'
						);
						return;
					}

					if ( numPlaceholders === undefined ) {
						// Track the number of placeholders discovered in the
						// string to verify that all other candidate options
						// have the same number.
						numPlaceholders = match.length;
					}
				}
			},
		};
	},
};
