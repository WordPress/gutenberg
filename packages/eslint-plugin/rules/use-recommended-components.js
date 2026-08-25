const {
	createPrivateApisState,
	trackPrivateApisSpecifier,
	getPropertyName,
	getUnlockDestructuring,
} = require( '../utils/private-apis' );

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
		allowed: [
			'Autocomplete',
			'Badge',
			'Calendar',
			'Card',
			'Collapsible',
			'CollapsibleCard',
			'ControlWithError',
			'EmptyState',
			'Field',
			'Fieldset',
			'Icon',
			'Input',
			'InputControl',
			'InputLayout',
			'KeyboardShortcutDescription',
			'KeyboardShortcutDisplay',
			'Link',
			'RangeCalendar',
			'Skeleton',
			'Spinner',
			'Stack',
			'Tabs',
			'Text',
			'Textarea',
			'TextareaControl',
			'Tooltip',
			'ValidatedInputControl',
			'ValidatedTextareaControl',
			'ValidityIndicator',
			'VisuallyHidden',
			'useKeyboardShortcutProps',
		],
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
		ExternalLink:
			'Use `Link` from `@wordpress/ui` with the `openInNewTab` prop instead.',
		__experimentalDivider: '{{ name }} is planned for deprecation.',
		__experimentalElevation:
			'Use elevation tokens from `@wordpress/base-styles` instead.',
		__experimentalGrid:
			'{{ name }} is planned for deprecation. Write your own CSS instead.',
		__experimentalHeading: 'Use `Text` from `@wordpress/ui` instead.',
		__experimentalHStack: 'Use `Stack` from `@wordpress/ui` instead.',
		__experimentalScrollable: '{{ name }} is planned for deprecation.',
		__experimentalSpacer: '{{ name }} is planned for deprecation.',
		__experimentalSurface:
			'Write your own CSS instead, preferably using the design tokens available in `@wordpress/theme`.',
		__experimentalText: 'Use `Text` from `@wordpress/ui` instead.',
		__experimentalView: '{{ name }} is planned for deprecation.',
		__experimentalVStack: 'Use `Stack` from `@wordpress/ui` instead.',
		__experimentalZStack:
			'{{ name }} is planned for deprecation. Write your own CSS instead.',
		Animate:
			'Write your own CSS animations instead, preferably using the motion tokens available in `@wordpress/theme`.',
		Card: 'Use `Card.Root` from `@wordpress/ui` instead.',
		CardBody: 'Use `Card.Content` from `@wordpress/ui` instead.',
		CardDivider: 'A divider is no longer a standard pattern for cards.',
		CardFooter: 'A footer is no longer a standard pattern for cards.',
		CardHeader:
			'Use `Card.Header` (and optionally `Card.Title`) from `@wordpress/ui` instead.',
		CardMedia: 'Use `Card.FullBleed` from `@wordpress/ui` instead.',
		Flex: 'For use cases not covered by `Stack` from `@wordpress/ui`, write your own CSS instead.',
		FlexBlock:
			'For use cases not covered by `Stack` from `@wordpress/ui`, write your own CSS instead.',
		FlexItem:
			'For use cases not covered by `Stack` from `@wordpress/ui`, write your own CSS instead.',
		__experimentalInputControl:
			'Use `InputControl` from `@wordpress/ui` instead. See migration guide in the lint rule documentation.',
		ResponsiveWrapper: '{{ name }} is planned for deprecation.',
		TabPanel: 'Use `Tabs` from `@wordpress/ui` instead.',
		TabbableContainer: '{{ name }} is planned for deprecation.',
		Tabs: 'Use `Tabs` from `@wordpress/ui` instead.',
		TextControl:
			'Use `InputControl` from `@wordpress/ui` instead. See migration guide in the lint rule documentation.',
		TextareaControl:
			'Use `TextareaControl` from `@wordpress/ui` instead. See migration guide in the lint rule documentation.',
		Tooltip: 'Use `Tooltip` from `@wordpress/ui` instead.',
		VisuallyHidden: 'Use `{{ name }}` from `@wordpress/ui` instead.',
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
		const privateApisState = createPrivateApisState();

		return {
			/** @param {import('estree').ImportDeclaration} node */
			ImportDeclaration( node ) {
				if ( typeof node.source.value !== 'string' ) {
					return;
				}

				const source = node.source.value;

				const allowlistEntry = ALLOWLIST[ source ];
				const denylistEntry = DENYLIST[ source ];

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					const name = specifier.imported.name;
					trackPrivateApisSpecifier(
						privateApisState,
						specifier,
						source,
						!! denylistEntry
					);

					if ( ! allowlistEntry && ! denylistEntry ) {
						return;
					}

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
			/** @param {import('estree').VariableDeclarator} node */
			VariableDeclarator( node ) {
				const unlockDestructuring = getUnlockDestructuring(
					node,
					context.sourceCode,
					privateApisState
				);
				if ( ! unlockDestructuring ) {
					return;
				}

				const { source, properties } = unlockDestructuring;
				const denylistEntry = DENYLIST[ source ];
				if ( ! denylistEntry ) {
					return;
				}

				properties.forEach( ( property ) => {
					const name = getPropertyName( property.key );
					if ( ! name || ! denylistEntry.hasOwnProperty( name ) ) {
						return;
					}

					context.report( {
						node: property.key,
						message: resolveMessage(
							denylistEntry[ name ],
							name,
							source
						),
					} );
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
