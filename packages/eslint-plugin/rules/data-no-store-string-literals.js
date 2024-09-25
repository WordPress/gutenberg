/**
 * Converts store name to variable name.
 * Removes dashes and uppercases the characters after dashes and appends `Store` at the end.
 *
 * @param {string} storeName
 * @return {string} store name as variable name
 */
function storeNameToVariableNames( storeName ) {
	return (
		storeName
			.split( '-' )
			.map( ( value, index ) =>
				index === 0
					? value.toLowerCase()
					: value[ 0 ].toUpperCase() + value.slice( 1 ).toLowerCase()
			)
			.join( '' ) + 'Store'
	);
}

/**
 * Returns last element of an array.
 *
 * @param {Array} array
 * @return {*} last element of the array
 */
function arrayLast( array ) {
	return array[ array.length - 1 ];
}

function getReferences( context, specifiers ) {
	const variables = specifiers.reduce(
		( acc, specifier ) =>
			acc.concat( context.sourceCode.getDeclaredVariables( specifier ) ),
		[]
	);
	const references = variables.reduce(
		( acc, variable ) => acc.concat( variable.references ),
		[]
	);
	return references;
}

function collectAllNodesFromCallbackFunctions( context, node ) {
	const functionSpecifiers = node.specifiers.filter(
		( specifier ) =>
			specifier.imported &&
			[
				'createRegistrySelector',
				'useSelect',
				'withSelect',
				'withDispatch',
			].includes( specifier.imported.name )
	);
	const functionReferences = getReferences( context, functionSpecifiers );

	const functionArgumentVariables = functionReferences.reduce(
		( acc, { identifier: { parent } } ) =>
			parent && parent.arguments && parent.arguments.length > 0
				? acc.concat(
						context.sourceCode.getDeclaredVariables(
							parent.arguments[ 0 ]
						)
				  )
				: acc,
		[]
	);
	const functionArgumentReferences = functionArgumentVariables.reduce(
		( acc, variable ) => acc.concat( variable.references ),
		[]
	);
	const possibleCallExpressionNodes = functionArgumentReferences
		.filter( ( reference ) => reference.identifier.parent )
		.map( ( reference ) => reference.identifier.parent );

	return possibleCallExpressionNodes;
}

function collectAllNodesFromDirectFunctionCalls( context, node ) {
	const specifiers = node.specifiers.filter(
		( specifier ) =>
			specifier.imported &&
			[
				'useDispatch',
				'dispatch',
				'useSelect',
				'select',
				'resolveSelect',
			].includes( specifier.imported.name )
	);
	const references = getReferences( context, specifiers );
	const possibleCallExpressionNodes = references
		.filter( ( reference ) => reference.identifier.parent )
		.map( ( reference ) => reference.identifier.parent );

	return possibleCallExpressionNodes;
}

function collectAllNodesFromObjectPropertyFunctionCalls( context, node ) {
	const specifiers = node.specifiers.filter(
		( specifier ) =>
			specifier.imported &&
			[ 'controls' ].includes( specifier.imported.name )
	);
	const references = getReferences( context, specifiers );
	const referencesWithPropertyCalls = references.filter(
		( reference ) =>
			reference.identifier.parent.property &&
			[ 'select', 'resolveSelect', 'dispatch' ].includes(
				reference.identifier.parent.property.name
			)
	);
	const possibleCallExpressionNodes = referencesWithPropertyCalls
		.filter(
			( reference ) =>
				reference.identifier.parent &&
				reference.identifier.parent.parent
		)
		.map( ( reference ) => reference.identifier.parent.parent );

	return possibleCallExpressionNodes;
}

function getSuggest( context, callNode ) {
	return [
		{
			desc: 'Replace literal with store definition. Import store if necessary.',
			fix: ( fixer ) => getFixes( fixer, context, callNode ),
		},
	];
}

function getFixes( fixer, context, callNode ) {
	const storeName = callNode.arguments[ 0 ].value;
	const storeDefinitions = {
		core: {
			import: '@wordpress/core-data',
			variable: 'coreStore',
		},
	};
	let storeDefinition = storeDefinitions[ storeName ];
	if ( ! storeDefinition && storeName.startsWith( 'core/' ) ) {
		const storeNameWithoutCore = storeName.substring( 5 );
		storeDefinition = {
			import: `@wordpress/${ storeNameWithoutCore }`,
			variable: storeNameToVariableNames( storeNameWithoutCore ),
		};
	}
	if ( ! storeDefinition ) {
		return null;
	}
	const { variable: variableName, import: importName } = storeDefinition;

	const fixes = [
		fixer.replaceText( callNode.arguments[ 0 ], variableName ),
	];

	const imports = context.sourceCode
		.getAncestors( callNode )[ 0 ]
		.body.filter( ( node ) => node.type === 'ImportDeclaration' );
	const packageImports = imports.filter(
		( node ) => node.source.value === importName
	);
	const packageImport =
		packageImports.length > 0 ? packageImports[ 0 ] : null;
	if ( packageImport ) {
		const alreadyHasStore = packageImport.specifiers.some(
			( specifier ) => specifier.imported.name === 'store'
		);
		if ( ! alreadyHasStore ) {
			const lastSpecifier = arrayLast( packageImport.specifiers );
			fixes.push(
				fixer.insertTextAfter(
					lastSpecifier,
					`,store as ${ variableName }`
				)
			);
		}
	} else {
		const wpImports = imports.filter( ( node ) =>
			node.source.value.startsWith( '@wordpress/' )
		);
		const lastImport =
			wpImports.length > 0
				? arrayLast( wpImports )
				: arrayLast( imports );

		fixes.push(
			fixer.insertTextAfter(
				lastImport,
				`\nimport { store as ${ variableName } } from '${ importName }';`
			)
		);
	}

	return fixes;
}

module.exports = {
	meta: {
		type: 'problem',
		hasSuggestions: true,
		schema: [],
		messages: {
			doNotUseStringLiteral: `Do not use string literals ( '{{ argument }}' ) for accessing @wordpress/data stores. Pass the store definition instead`,
		},
	},
	create( context ) {
		return {
			ImportDeclaration( node ) {
				if ( node.source.value !== '@wordpress/data' ) {
					return;
				}

				const callbackFunctionNodes =
					collectAllNodesFromCallbackFunctions( context, node );
				const directNodes = collectAllNodesFromDirectFunctionCalls(
					context,
					node
				);
				const objectPropertyCallNodes =
					collectAllNodesFromObjectPropertyFunctionCalls(
						context,
						node
					);

				const allNodes = [
					...callbackFunctionNodes,
					...directNodes,
					...objectPropertyCallNodes,
				];
				allNodes
					.filter(
						( callNode ) =>
							callNode &&
							callNode.type === 'CallExpression' &&
							callNode.arguments.length > 0 &&
							callNode.arguments[ 0 ].type === 'Literal'
					)
					.forEach( ( callNode ) => {
						context.report( {
							node: callNode.parent,
							messageId: 'doNotUseStringLiteral',
							data: { argument: callNode.arguments[ 0 ].value },
							suggest: getSuggest( context, callNode ),
						} );
					} );
			},
		};
	},
};
