/**
 * External dependencies
 */
const semver = require( 'semver' );

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Require @since tags to use strict semver version, followed by optional description',
		},
		schema: [],
	},
	create( context ) {
		const sourceCode = context.getSourceCode();

		return {
			Program() {
				const comments = sourceCode.getAllComments();

				for ( const comment of comments ) {
					if (
						comment.type !== 'Block' ||
						! comment.value.includes( '@since' )
					) {
						continue;
					}

					/** @type {string[]} */
					const lines = comment.value.split( '\n' );

					for ( const line of lines ) {
						const sinceMatch = line.match(
							/@since\s+([^\s]+)(.*)/
						);

						if ( ! sinceMatch ) {
							continue;
						}

						const version = sinceMatch[ 1 ];

						if ( ! semver.valid( version ) ) {
							context.report( {
								loc: comment.loc,
								message: `@since version "${ version }" is invalid. Must be valid semver (e.g., 1.2.3).`,
							} );
						}
					}
				}
			},
		};
	},
};
