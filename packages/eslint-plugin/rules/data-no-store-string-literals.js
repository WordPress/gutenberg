function arrayLast( array ) {
	return array[ array.length - 1 ];
}

function getReferences( context, specifiers ) {
	const variables = specifiers.reduce(
		( acc, specifier ) =>
			acc.concat( context.getDeclaredVariables( specifier ) ),
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
						context.getDeclaredVariables( parent.arguments[ 0 ] )
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
			[ 'useDispatch', 'dispatch', 'select', 'resolveSelect' ].includes(
				specifier.imported.name
			)
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
			desc:
				'Replace literal with store definition. Import store if neccessary.',
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
		'core/block-editor': {
			import: '@wordpress/block-editor',
			variable: 'blockEditorStore',
		},
		'core/block-directory': {
			import: '@wordpress/block-directory',
			variable: 'blockDirectoryStore',
		},
		'core/blocks': {
			import: '@wordpress/blocks',
			variable: 'blocksStore',
		},
		'core/editor': {
			import: '@wordpress/editor',
			variable: 'editorStore',
		},
		'core/notices': {
			import: '@wordpress/notices',
			variable: 'noticesStore',
		},
		'core/reusable-blocks': {
			import: '@wordpress/reusable-blocks',
			variable: 'reusableBlocksStore',
		},
		'core/keyboard-shortcuts': {
			import: '@wordpress/keyboard-shortcuts',
			variable: 'keyboardShortcutsStore',
		},
		'core/edit-post': {
			import: '@wordpress/edit-post',
			variable: 'editPostStore',
		},
		'core/edit-site': {
			import: '@wordpress/edit-site',
			variable: 'editSiteStore',
		},
		'core/interface': {
			import: '@wordpress/interface',
			variable: 'interfaceStore',
		},
		'core/viewport': {
			import: '@wordpress/viewport',
			variable: 'viewportStore',
		},
		'core/rich-text': {
			import: '@wordpress/rich-text',
			variable: 'richTextStore',
		},
	};
	if ( ! storeDefinitions[ storeName ] ) {
		return null;
	}
	const { variable: variableName, import: importName } = storeDefinitions[
		storeName
	];

	const fixes = [
		fixer.replaceText( callNode.arguments[ 0 ], variableName ),
	];

	const imports = context
		.getAncestors()[ 0 ]
		.body.filter( ( n ) => n.type === 'ImportDeclaration' );
	const packageImports = imports.filter(
		( n ) => n.source.value === importName
	);
	const i = packageImports.length > 0 ? packageImports[ 0 ] : null;
	if ( i ) {
		const alreadyHasStore = i.specifiers.some(
			( s ) => s.imported.name === 'store'
		);
		if ( ! alreadyHasStore ) {
			const lastSpecifier = arrayLast( i.specifiers );
			fixes.push(
				fixer.insertTextAfter(
					lastSpecifier,
					`,store as ${ variableName }`
				)
			);
		}
	} else {
		const wpImports = imports.filter( ( n ) =>
			n.source.value.startsWith( '@wordpress/' )
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

				const callbackFunctionNodes = collectAllNodesFromCallbackFunctions(
					context,
					node
				);
				const directNodes = collectAllNodesFromDirectFunctionCalls(
					context,
					node
				);
				const objectPropertyCallNodes = collectAllNodesFromObjectPropertyFunctionCalls(
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
