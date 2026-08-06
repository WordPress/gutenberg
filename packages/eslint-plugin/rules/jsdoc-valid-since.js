const SEMVER_PATTERN =
	/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const SINCE_TAG_PATTERN = /^\s*\*?\s*@since(?:\s+(.*?))?\s*$/;

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Enforce semantic versions in @since JSDoc tags while allowing an optional description.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/jsdoc-valid-since.md',
		},
		schema: [],
		messages: {
			invalidSince:
				'@since must start with a valid semantic version (for example, 6.7.0), followed by an optional description.',
		},
	},

	create( context ) {
		const sourceCode = context.sourceCode;

		return {
			Program() {
				for ( const comment of sourceCode.getAllComments() ) {
					if (
						comment.type !== 'Block' ||
						! comment.value.startsWith( '*' )
					) {
						continue;
					}

					for ( const line of comment.value.split( /\r?\n/ ) ) {
						const match = line.match( SINCE_TAG_PATTERN );

						if ( ! match ) {
							continue;
						}

						const value = match[ 1 ]?.trim() ?? '';
						const [ version = '' ] = value.split( /\s+/, 1 );

						if ( ! SEMVER_PATTERN.test( version ) ) {
							context.report( {
								node: comment,
								messageId: 'invalidSince',
							} );
						}
					}
				}
			},
		};
	},
};
