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
						} );
					} );
			},
		};
	},
};
