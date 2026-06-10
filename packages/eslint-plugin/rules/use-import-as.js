const {
	createPrivateApisState,
	trackPrivateApisSpecifier,
	getPropertyName,
	getUnlockDestructuring,
} = require( '../utils/private-apis' );

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'suggestion',
		hasSuggestions: true,
		docs: {
			description:
				'Enforce configured `as` names for specific named imports and unlocked private APIs.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/use-import-as.md',
		},
		schema: [
			{
				type: 'object',
				additionalProperties: {
					type: 'object',
					minProperties: 1,
					additionalProperties: {
						type: 'string',
					},
				},
			},
		],
		messages: {
			mustUseImportAs:
				'`{{ importedName }}` from `{{ source }}` must be imported as `{{ localName }}`.',
			useImportAsSuggestion: 'Import as `{{ localName }}`.',
			useUnlockAsSuggestion: 'Destructure as `{{ localName }}`.',
		},
	},
	create( context ) {
		const importAsMap =
			context.options.length > 0 &&
			context.options[ 0 ] &&
			typeof context.options[ 0 ] === 'object'
				? context.options[ 0 ]
				: {};
		const privateApisState = createPrivateApisState();

		return {
			/** @param {import('estree').ImportDeclaration} node */
			ImportDeclaration( node ) {
				if ( typeof node.source.value !== 'string' ) {
					return;
				}

				const source = node.source.value;
				const sourceMap = importAsMap[ source ];

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					const importedName = specifier.imported.name;
					trackPrivateApisSpecifier(
						privateApisState,
						specifier,
						source,
						!! sourceMap
					);

					if ( ! sourceMap ) {
						return;
					}

					if ( ! sourceMap.hasOwnProperty( importedName ) ) {
						return;
					}

					const localName = sourceMap[ importedName ];
					if ( specifier.local.name === localName ) {
						return;
					}

					context.report( {
						node: specifier.local,
						messageId: 'mustUseImportAs',
						data: {
							importedName,
							source,
							localName,
						},
						suggest: [
							{
								messageId: 'useImportAsSuggestion',
								data: {
									localName,
								},
								fix( fixer ) {
									return fixer.replaceText(
										specifier,
										getImportSpecifierSuggestionText(
											specifier,
											context.sourceCode,
											localName
										)
									);
								},
							},
						],
					} );
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
				const sourceMap = importAsMap[ source ];
				if ( ! sourceMap ) {
					return;
				}

				properties.forEach( ( property ) => {
					const importedName = getPropertyName( property.key );
					if (
						! importedName ||
						! sourceMap.hasOwnProperty( importedName )
					) {
						return;
					}

					const localName = sourceMap[ importedName ];

					const propertyLocalName = getPropertyLocalName(
						property.value
					);
					if (
						! propertyLocalName ||
						propertyLocalName === localName
					) {
						return;
					}

					context.report( {
						node: getReportNode( property.value ),
						messageId: 'mustUseImportAs',
						data: {
							importedName,
							source,
							localName,
						},
						suggest: [
							{
								messageId: 'useUnlockAsSuggestion',
								data: {
									localName,
								},
								fix( fixer ) {
									return fixer.replaceText(
										property,
										getPropertySuggestionText(
											property,
											context.sourceCode,
											localName
										)
									);
								},
							},
						],
					} );
				} );
			},
		};
	},
};

/**
 * @param {import('estree').ImportSpecifier} specifier
 * @param {import('eslint').SourceCode}      sourceCode
 * @param {string}                           localName
 * @return {string} Suggested replacement text for an import specifier.
 */
function getImportSpecifierSuggestionText( specifier, sourceCode, localName ) {
	return `${ sourceCode.getText( specifier.imported ) } as ${ localName }`;
}

/**
 * @param {import('estree').Property}   property
 * @param {import('eslint').SourceCode} sourceCode
 * @param {string}                      localName
 * @return {string} Suggested replacement text for a destructuring property.
 */
function getPropertySuggestionText( property, sourceCode, localName ) {
	const keyText = sourceCode.getText( property.key );

	if ( property.value.type === 'AssignmentPattern' ) {
		return `${ keyText }: ${ localName } = ${ sourceCode.getText(
			property.value.right
		) }`;
	}

	return `${ keyText }: ${ localName }`;
}

/**
 * @param {import('estree').Pattern} value
 * @return {string|null} Local variable name.
 */
function getPropertyLocalName( value ) {
	if ( value.type === 'Identifier' ) {
		return value.name;
	}

	if (
		value.type === 'AssignmentPattern' &&
		value.left.type === 'Identifier'
	) {
		return value.left.name;
	}

	return null;
}

/**
 * @param {import('estree').Pattern} value
 * @return {import('estree').Node} Node to report on.
 */
function getReportNode( value ) {
	if (
		value.type === 'AssignmentPattern' &&
		value.left.type === 'Identifier'
	) {
		return value.left;
	}

	return value;
}

module.exports = rule;
