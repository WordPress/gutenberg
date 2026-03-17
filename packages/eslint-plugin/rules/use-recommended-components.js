/**
 * Allowlist: only the listed components are permitted from these packages.
 * Any other named import will be flagged with the package's message.
 *
 * `message` supports `{{ name }}` and `{{ source }}` placeholders.
 *
 * @type {Record<string, { allowed: string[], message?: string }>}
 */
const ALLOWLIST = {
	'@wordpress/ui': {
		allowed: [ 'Badge', 'Stack' ],
		message:
			'`{{ name }}` from `{{ source }}` is not yet recommended for use in a WordPress environment.',
	},
};

/**
 * Denylist: the listed components are flagged with a message pointing
 * to a recommended alternative.
 *
 * Messages support `{{ name }}` and `{{ source }}` placeholders.
 *
 * @type {Record<string, Record<string, string>>}
 */
const DENYLIST = {
	'@wordpress/components': {
		__experimentalZStack:
			'{{ name }} is planned for deprecation. Write your own CSS instead.',
	},
};

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Encourage the use of recommended UI components in a WordPress environment.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/use-recommended-components.md',
		},
		schema: [],
	},
	create( context ) {
		return {
			/** @param {import('estree').ImportDeclaration} node */
			ImportDeclaration( node ) {
				if ( typeof node.source.value !== 'string' ) {
					return;
				}

				const source = node.source.value;

				const allowlistEntry = ALLOWLIST[ source ];
				const denylistEntry = DENYLIST[ source ];

				if ( ! allowlistEntry && ! denylistEntry ) {
					return;
				}

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					const name = specifier.imported.name;

					if (
						allowlistEntry &&
						! allowlistEntry.allowed.includes( name )
					) {
						context.report( {
							node: specifier,
							message: resolveMessage(
								allowlistEntry.message,
								name,
								source
							),
						} );
					}

					if ( denylistEntry?.hasOwnProperty( name ) ) {
						context.report( {
							node: specifier,
							message: resolveMessage(
								denylistEntry[ name ],
								name,
								source
							),
						} );
					}
				} );
			},
		};
	},
};

/**
 * @param {string|undefined} template
 * @param {string}           name
 * @param {string}           source
 * @return {string} Resolved message string.
 */
function resolveMessage( template, name, source ) {
	if ( ! template ) {
		return `\`${ name }\` from \`${ source }\` is not recommended.`;
	}
	return template
		.replace( /\{\{\s*name\s*\}\}/g, name )
		.replace( /\{\{\s*source\s*\}\}/g, source );
}

module.exports = rule;
module.exports.ALLOWLIST = ALLOWLIST;
module.exports.DENYLIST = DENYLIST;
