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
		const privateApisSources = new Map();
		const trackedUnlockImports = new Set();

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

					const importedName = getImportedName( specifier );
					if ( importedName === 'unlock' ) {
						trackedUnlockImports.add( specifier.local.name );
					}

					if ( ! sourceMap ) {
						return;
					}

					if ( importedName === 'privateApis' ) {
						privateApisSources.set( specifier.local.name, source );
					}
					const localName = sourceMap[ importedName ];

					if ( ! localName || specifier.local.name === localName ) {
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
				if (
					node.parent.type !== 'VariableDeclaration' ||
					node.parent.kind !== 'const' ||
					node.id.type !== 'ObjectPattern' ||
					! isUnlockCall(
						node.init,
						context.sourceCode,
						trackedUnlockImports
					)
				) {
					return;
				}

				const privateApisIdentifier = node.init.arguments[ 0 ];
				if ( privateApisIdentifier.type !== 'Identifier' ) {
					return;
				}

				const source = privateApisSources.get(
					privateApisIdentifier.name
				);
				if ( ! source ) {
					return;
				}

				const sourceMap = importAsMap[ source ];
				if ( ! sourceMap ) {
					return;
				}

				node.id.properties.forEach( ( property ) => {
					if ( property.type !== 'Property' || property.computed ) {
						return;
					}

					const importedName = getPropertyName( property.key );
					if ( ! importedName ) {
						return;
					}

					const localName = sourceMap[ importedName ];
					if ( ! localName ) {
						return;
					}

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
 * @return {string} Imported name.
 */
function getImportedName( specifier ) {
	return specifier.imported.type === 'Identifier'
		? specifier.imported.name
		: String( specifier.imported.value );
}

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
 * @param {import('estree').CallExpression|import('estree').Expression|null} node
 * @param {import('eslint').SourceCode}                                      sourceCode
 * @param {ReadonlySet<string>}                                              trackedUnlockImports
 * @return {node is import('estree').CallExpression} Whether this is an `unlock()` call with one argument.
 */
function isUnlockCall( node, sourceCode, trackedUnlockImports ) {
	if (
		node &&
		node.type === 'CallExpression' &&
		node.callee.type === 'Identifier' &&
		node.arguments.length === 1
	) {
		if ( ! trackedUnlockImports.has( node.callee.name ) ) {
			return false;
		}

		const { references } = sourceCode.getScope( node.callee );
		const reference = references.find(
			( currentReference ) => currentReference.identifier === node.callee
		);

		return !! reference?.resolved?.defs.some(
			( definition ) => definition.type === 'ImportBinding'
		);
	}

	return false;
}

/**
 * @param {import('estree').Expression|import('estree').PrivateIdentifier} key
 * @return {string|null} Property name.
 */
function getPropertyName( key ) {
	if ( key.type === 'Identifier' ) {
		return key.name;
	}

	if ( key.type === 'Literal' ) {
		return String( key.value );
	}

	return null;
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
