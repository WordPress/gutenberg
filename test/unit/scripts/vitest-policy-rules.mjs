import { isBuiltin } from 'node:module';
import typescriptEslintParser from '@typescript-eslint/parser';
import { hasTestEnvironmentOverride } from './test-environment-overrides.mjs';

const browserApiIdentifiers = new Set( [
	'IntersectionObserver',
	'ResizeObserver',
	'cancelAnimationFrame',
	'matchMedia',
	'requestAnimationFrame',
	'scrollBy',
	'scrollTo',
] );
const browserApiProperties = new Set( [
	...browserApiIdentifiers,
	'animate',
	'clientHeight',
	'clientLeft',
	'clientTop',
	'clientWidth',
	'getBoundingClientRect',
	'getClientRects',
	'getAnimations',
	'innerHeight',
	'innerWidth',
	'offsetHeight',
	'offsetLeft',
	'offsetTop',
	'offsetWidth',
	'scrollHeight',
	'scrollIntoView',
	'scrollLeft',
	'scrollTop',
	'scrollWidth',
] );
const vitestApiNames = new Set( [
	'afterAll',
	'afterEach',
	'assert',
	'beforeAll',
	'beforeEach',
	'describe',
	'expect',
	'expectTypeOf',
	'it',
	'onTestFailed',
	'onTestFinished',
	'suite',
	'test',
	'vi',
] );
const vitestCollectorApiNames = new Set( [
	'describe',
	'it',
	'suite',
	'test',
] );
const competingTestRunnerModules = new Set( [ '@jest/globals', 'node:test' ] );
const browserModeModules = new Set( [ '@vitest/browser', 'vitest/browser' ] );
const policyExceptionKeys = new Set( [
	'browserFireEvent',
	'jsdomBrowserApis',
] );
const browserGlobalObjectNames = new Set( [
	'Document',
	'Element',
	'HTMLElement',
	'Node',
	'Range',
	'SVGElement',
	'document',
] );
const browserGlobalContainerNames = new Set( [ 'globalThis', 'window' ] );
const domProducingProperties = new Set( [
	'body',
	'defaultView',
	'document',
	'documentElement',
	'firstChild',
	'firstElementChild',
	'lastChild',
	'lastElementChild',
	'nextElementSibling',
	'parentElement',
	'parentNode',
	'previousElementSibling',
	'prototype',
] );
const domProducingMethods = new Set( [
	'closest',
	'createElement',
	'createElementNS',
	'elementFromPoint',
	'getElementById',
	'querySelector',
] );
const domCollectionCallbackElementParameterIndexes = new Map( [
	[ 'every', 0 ],
	[ 'filter', 0 ],
	[ 'find', 0 ],
	[ 'findIndex', 0 ],
	[ 'findLast', 0 ],
	[ 'findLastIndex', 0 ],
	[ 'flatMap', 0 ],
	[ 'forEach', 0 ],
	[ 'map', 0 ],
	[ 'reduce', 1 ],
	[ 'reduceRight', 1 ],
	[ 'some', 0 ],
] );
const testingLibraryQueryPattern = /^(?:get|query)By/;
const testingLibraryAsyncQueryPattern = /^findBy/;
const testingLibraryCollectionQueryPattern = /^(?:get|query)AllBy/;
const testingLibraryAsyncCollectionQueryPattern = /^findAllBy/;
const testingLibraryResultDomProperties = new Set( [
	'baseElement',
	'container',
] );

function getTestingLibraryQueryVariables(
	propertyName,
	{
		asyncCollectionVariables,
		asyncDomVariables,
		collectionVariables,
		domVariables,
	}
) {
	if ( testingLibraryAsyncCollectionQueryPattern.test( propertyName ) ) {
		return asyncCollectionVariables;
	}

	if ( testingLibraryAsyncQueryPattern.test( propertyName ) ) {
		return asyncDomVariables;
	}

	if ( testingLibraryCollectionQueryPattern.test( propertyName ) ) {
		return collectionVariables;
	}

	if ( testingLibraryQueryPattern.test( propertyName ) ) {
		return domVariables;
	}

	return null;
}

function getImportedName( specifier ) {
	if ( specifier.type === 'ImportDefaultSpecifier' ) {
		return 'default';
	}

	if ( specifier.type === 'ImportNamespaceSpecifier' ) {
		return '*';
	}

	return specifier.imported?.name ?? specifier.imported?.value ?? null;
}

function getMemberPropertyName( node ) {
	if ( node?.type !== 'MemberExpression' ) {
		return null;
	}

	if ( ! node.computed && node.property?.type === 'Identifier' ) {
		return node.property.name;
	}

	if (
		node.computed &&
		( node.property?.type === 'Literal' ||
			node.property?.type === 'StringLiteral' )
	) {
		return node.property.value;
	}

	return null;
}

function isUnboundIdentifier( node, name, unboundIdentifiers ) {
	return (
		node?.type === 'Identifier' &&
		node.name === name &&
		unboundIdentifiers.has( node )
	);
}

function createIdentifierVariableMap( scopeManager ) {
	const identifierVariables = new WeakMap();

	for ( const scope of scopeManager.scopes ) {
		for ( const variable of scope.variables ) {
			for ( const identifier of variable.identifiers ) {
				identifierVariables.set( identifier, variable );
			}
			for ( const reference of variable.references ) {
				identifierVariables.set( reference.identifier, variable );
			}
		}
	}

	return identifierVariables;
}

function isVariableReference( node, variables, identifierVariables ) {
	const variable =
		node?.type === 'Identifier'
			? identifierVariables.get( node )
			: undefined;
	return variable !== undefined && variables.has( variable );
}

function getPatternIdentifiers( node ) {
	if ( node?.type === 'Identifier' ) {
		return [ node ];
	}
	if ( node?.type === 'AssignmentPattern' ) {
		return getPatternIdentifiers( node.left );
	}
	if ( node?.type === 'RestElement' ) {
		return getPatternIdentifiers( node.argument );
	}
	if ( node?.type === 'ArrayPattern' ) {
		return node.elements.flatMap( getPatternIdentifiers );
	}
	if ( node?.type === 'ObjectPattern' ) {
		return node.properties.flatMap( ( property ) =>
			getPatternIdentifiers(
				property.type === 'RestElement'
					? property.argument
					: property.value
			)
		);
	}

	return [];
}

function getObjectPatternPropertyIdentifiers( node, propertyName ) {
	if ( node?.type !== 'ObjectPattern' ) {
		return [];
	}

	return node.properties.flatMap( ( property ) => {
		if (
			property.type === 'Property' &&
			( property.key?.name ?? property.key?.value ) === propertyName
		) {
			return getPatternIdentifiers( property.value );
		}
		return [];
	} );
}

function isBrowserGlobalContainer( node, unboundIdentifiers ) {
	return (
		node?.type === 'Identifier' &&
		browserGlobalContainerNames.has( node.name ) &&
		unboundIdentifiers.has( node )
	);
}

function isWindowReference(
	node,
	unboundIdentifiers,
	windowVariables,
	identifierVariables
) {
	return (
		isBrowserGlobalContainer( node, unboundIdentifiers ) ||
		isVariableReference( node, windowVariables, identifierVariables ) ||
		( getMemberPropertyName( node ) === 'defaultView' &&
			isUnboundIdentifier( node.object, 'document', unboundIdentifiers ) )
	);
}

function isTestingLibraryQueryExpression(
	node,
	testingLibraryScreenVariables,
	testingLibraryFunctionVariables,
	testingLibraryNamespaceVariables,
	identifierVariables,
	queryPattern
) {
	if ( node?.type !== 'CallExpression' ) {
		return false;
	}

	if (
		isVariableReference(
			node.callee,
			testingLibraryFunctionVariables,
			identifierVariables
		)
	) {
		return true;
	}

	if (
		node.callee?.type !== 'MemberExpression' ||
		! queryPattern.test( getMemberPropertyName( node.callee ) ?? '' )
	) {
		return false;
	}

	const receiver = node.callee.object;
	if (
		testingLibraryScreenVariables.has( receiver ) ||
		isVariableReference(
			receiver,
			testingLibraryScreenVariables,
			identifierVariables
		)
	) {
		return true;
	}
	if (
		isVariableReference(
			receiver,
			testingLibraryNamespaceVariables,
			identifierVariables
		)
	) {
		return true;
	}

	return (
		receiver?.type === 'MemberExpression' &&
		getMemberPropertyName( receiver ) === 'screen' &&
		isVariableReference(
			receiver.object,
			testingLibraryNamespaceVariables,
			identifierVariables
		)
	);
}

function isTestingLibraryDomExpression(
	node,
	testingLibraryScreenVariables,
	testingLibraryDomFunctionVariables,
	testingLibraryAsyncDomFunctionVariables,
	testingLibraryNamespaceVariables,
	identifierVariables,
	allowAsync = false
) {
	return isTestingLibraryQueryExpression(
		node,
		testingLibraryScreenVariables,
		allowAsync
			? testingLibraryAsyncDomFunctionVariables
			: testingLibraryDomFunctionVariables,
		testingLibraryNamespaceVariables,
		identifierVariables,
		allowAsync
			? testingLibraryAsyncQueryPattern
			: testingLibraryQueryPattern
	);
}

function isTestingLibraryDomCollectionExpression(
	node,
	testingLibraryScreenVariables,
	testingLibraryCollectionFunctionVariables,
	testingLibraryAsyncCollectionFunctionVariables,
	testingLibraryNamespaceVariables,
	identifierVariables,
	allowAsync = false
) {
	return isTestingLibraryQueryExpression(
		node,
		testingLibraryScreenVariables,
		allowAsync
			? testingLibraryAsyncCollectionFunctionVariables
			: testingLibraryCollectionFunctionVariables,
		testingLibraryNamespaceVariables,
		identifierVariables,
		allowAsync
			? testingLibraryAsyncCollectionQueryPattern
			: testingLibraryCollectionQueryPattern
	);
}

function isTestingLibraryQueryContainerExpression(
	node,
	testingLibraryQueryContainerFunctionVariables,
	testingLibraryNamespaceVariables,
	identifierVariables
) {
	if ( node?.type !== 'CallExpression' ) {
		return false;
	}

	if (
		isVariableReference(
			node.callee,
			testingLibraryQueryContainerFunctionVariables,
			identifierVariables
		)
	) {
		return true;
	}

	return (
		node.callee?.type === 'MemberExpression' &&
		[ 'render', 'within' ].includes(
			getMemberPropertyName( node.callee )
		) &&
		isVariableReference(
			node.callee.object,
			testingLibraryNamespaceVariables,
			identifierVariables
		)
	);
}

function isBrowserGlobalExpression(
	node,
	unboundIdentifiers,
	domVariables,
	domCollectionVariables,
	identifierVariables,
	windowVariables,
	testingLibraryScreenVariables,
	testingLibraryDomFunctionVariables,
	testingLibraryAsyncDomFunctionVariables,
	testingLibraryCollectionFunctionVariables,
	testingLibraryAsyncCollectionFunctionVariables,
	testingLibraryNamespaceVariables
) {
	if ( node?.type === 'Identifier' ) {
		return (
			domVariables.has( identifierVariables.get( node ) ) ||
			( browserGlobalObjectNames.has( node.name ) &&
				unboundIdentifiers.has( node ) )
		);
	}

	if ( node?.type === 'CallExpression' ) {
		if (
			isTestingLibraryDomExpression(
				node,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryNamespaceVariables,
				identifierVariables
			)
		) {
			return true;
		}

		if (
			node.callee?.type === 'MemberExpression' &&
			getMemberPropertyName( node.callee ) === 'at' &&
			( isVariableReference(
				node.callee.object,
				domCollectionVariables,
				identifierVariables
			) ||
				isTestingLibraryDomCollectionExpression(
					node.callee.object,
					testingLibraryScreenVariables,
					testingLibraryCollectionFunctionVariables,
					testingLibraryAsyncCollectionFunctionVariables,
					testingLibraryNamespaceVariables,
					identifierVariables
				) )
		) {
			return true;
		}

		if (
			node.callee?.type !== 'MemberExpression' ||
			! domProducingMethods.has( getMemberPropertyName( node.callee ) )
		) {
			return false;
		}

		return isBrowserGlobalExpression(
			node.callee.object,
			unboundIdentifiers,
			domVariables,
			domCollectionVariables,
			identifierVariables,
			windowVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
			testingLibraryAsyncDomFunctionVariables,
			testingLibraryCollectionFunctionVariables,
			testingLibraryAsyncCollectionFunctionVariables,
			testingLibraryNamespaceVariables
		);
	}

	if ( node?.type === 'MemberExpression' ) {
		const propertyName = getMemberPropertyName( node );
		if (
			testingLibraryResultDomProperties.has( propertyName ) &&
			isVariableReference(
				node.object,
				testingLibraryScreenVariables,
				identifierVariables
			)
		) {
			return true;
		}
		if (
			node.computed &&
			typeof propertyName === 'number' &&
			( isVariableReference(
				node.object,
				domCollectionVariables,
				identifierVariables
			) ||
				isTestingLibraryDomCollectionExpression(
					node.object,
					testingLibraryScreenVariables,
					testingLibraryCollectionFunctionVariables,
					testingLibraryAsyncCollectionFunctionVariables,
					testingLibraryNamespaceVariables,
					identifierVariables
				) )
		) {
			return true;
		}
		if (
			isWindowReference(
				node.object,
				unboundIdentifiers,
				windowVariables,
				identifierVariables
			)
		) {
			return (
				browserGlobalObjectNames.has( propertyName ) ||
				domProducingProperties.has( propertyName )
			);
		}

		if ( ! domProducingProperties.has( propertyName ) ) {
			return false;
		}

		return isBrowserGlobalExpression(
			node.object,
			unboundIdentifiers,
			domVariables,
			domCollectionVariables,
			identifierVariables,
			windowVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
			testingLibraryAsyncDomFunctionVariables,
			testingLibraryCollectionFunctionVariables,
			testingLibraryAsyncCollectionFunctionVariables,
			testingLibraryNamespaceVariables
		);
	}

	if ( node?.type === 'ConditionalExpression' ) {
		return (
			isBrowserGlobalExpression(
				node.consequent,
				unboundIdentifiers,
				domVariables,
				domCollectionVariables,
				identifierVariables,
				windowVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryCollectionFunctionVariables,
				testingLibraryAsyncCollectionFunctionVariables,
				testingLibraryNamespaceVariables
			) ||
			isBrowserGlobalExpression(
				node.alternate,
				unboundIdentifiers,
				domVariables,
				domCollectionVariables,
				identifierVariables,
				windowVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryCollectionFunctionVariables,
				testingLibraryAsyncCollectionFunctionVariables,
				testingLibraryNamespaceVariables
			)
		);
	}

	if ( node?.type === 'LogicalExpression' ) {
		return (
			isBrowserGlobalExpression(
				node.left,
				unboundIdentifiers,
				domVariables,
				domCollectionVariables,
				identifierVariables,
				windowVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryCollectionFunctionVariables,
				testingLibraryAsyncCollectionFunctionVariables,
				testingLibraryNamespaceVariables
			) ||
			isBrowserGlobalExpression(
				node.right,
				unboundIdentifiers,
				domVariables,
				domCollectionVariables,
				identifierVariables,
				windowVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryCollectionFunctionVariables,
				testingLibraryAsyncCollectionFunctionVariables,
				testingLibraryNamespaceVariables
			)
		);
	}

	if ( node?.type === 'AwaitExpression' ) {
		return (
			isTestingLibraryDomExpression(
				node.argument,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryNamespaceVariables,
				identifierVariables,
				true
			) ||
			isBrowserGlobalExpression(
				node.argument,
				unboundIdentifiers,
				domVariables,
				domCollectionVariables,
				identifierVariables,
				windowVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryAsyncDomFunctionVariables,
				testingLibraryCollectionFunctionVariables,
				testingLibraryAsyncCollectionFunctionVariables,
				testingLibraryNamespaceVariables
			)
		);
	}

	if (
		[
			'ChainExpression',
			'TSAsExpression',
			'TSNonNullExpression',
			'TSTypeAssertion',
		].includes( node?.type )
	) {
		return isBrowserGlobalExpression(
			node.expression,
			unboundIdentifiers,
			domVariables,
			domCollectionVariables,
			identifierVariables,
			windowVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
			testingLibraryAsyncDomFunctionVariables,
			testingLibraryCollectionFunctionVariables,
			testingLibraryAsyncCollectionFunctionVariables,
			testingLibraryNamespaceVariables
		);
	}

	return false;
}

function isImportedApiReference(
	node,
	apiName,
	apiVariables,
	namespaceVariables,
	identifierVariables
) {
	if ( isVariableReference( node, apiVariables, identifierVariables ) ) {
		return true;
	}

	return (
		node?.type === 'MemberExpression' &&
		getMemberPropertyName( node ) === apiName &&
		isVariableReference(
			node.object,
			namespaceVariables,
			identifierVariables
		)
	);
}

function isVitestExpectCall(
	node,
	expectVariables,
	namespaceVariables,
	identifierVariables
) {
	if ( node?.type !== 'CallExpression' ) {
		return false;
	}

	let expectReference = node.callee;
	if (
		expectReference?.type === 'MemberExpression' &&
		[ 'poll', 'soft' ].includes( getMemberPropertyName( expectReference ) )
	) {
		expectReference = expectReference.object;
	}

	return isImportedApiReference(
		expectReference,
		'expect',
		expectVariables,
		namespaceVariables,
		identifierVariables
	);
}

function isVitestMatcherCall(
	node,
	matcherName,
	expectVariables,
	namespaceVariables,
	identifierVariables
) {
	if (
		node?.type !== 'CallExpression' ||
		getMemberPropertyName( node.callee ) !== matcherName
	) {
		return false;
	}

	let received = node.callee.object;
	while (
		received?.type === 'MemberExpression' &&
		[ 'not', 'rejects', 'resolves' ].includes(
			getMemberPropertyName( received )
		)
	) {
		received = received.object;
	}

	return isVitestExpectCall(
		received,
		expectVariables,
		namespaceVariables,
		identifierVariables
	);
}

function isDynamicImport( node ) {
	return (
		node?.type === 'ImportExpression' ||
		( node?.type === 'CallExpression' && node.callee?.type === 'Import' )
	);
}

function isComputedStyleReference(
	node,
	unboundIdentifiers,
	computedStyleVariables,
	windowVariables,
	identifierVariables
) {
	if ( node?.type === 'Identifier' ) {
		if (
			isVariableReference(
				node,
				computedStyleVariables,
				identifierVariables
			)
		) {
			return true;
		}
		return isUnboundIdentifier(
			node,
			'getComputedStyle',
			unboundIdentifiers
		);
	}

	return (
		getMemberPropertyName( node ) === 'getComputedStyle' &&
		isWindowReference(
			node.object,
			unboundIdentifiers,
			windowVariables,
			identifierVariables
		)
	);
}

function isCommonJsExport( node, unboundIdentifiers ) {
	let member = node;

	while ( member?.type === 'MemberExpression' ) {
		if (
			isUnboundIdentifier(
				member.object,
				'exports',
				unboundIdentifiers
			) ||
			( isUnboundIdentifier(
				member.object,
				'module',
				unboundIdentifiers
			) &&
				getMemberPropertyName( member ) === 'exports' )
		) {
			return true;
		}

		member = member.object;
	}

	return false;
}

function hasRuntimeModuleReference( node ) {
	if ( node.type === 'ImportExpression' ) {
		return true;
	}
	if ( node.type === 'TSImportEqualsDeclaration' ) {
		return node.importKind !== 'type';
	}

	if (
		node.type !== 'ImportDeclaration' &&
		node.type !== 'ExportAllDeclaration' &&
		node.type !== 'ExportNamedDeclaration'
	) {
		return false;
	}

	if ( node.importKind === 'type' || node.exportKind === 'type' ) {
		return false;
	}

	return (
		! node.specifiers?.length ||
		node.specifiers.some(
			( specifier ) =>
				specifier.importKind !== 'type' &&
				specifier.exportKind !== 'type'
		)
	);
}

function getStaticStringValue( node ) {
	if ( typeof node?.value === 'string' ) {
		return node.value;
	}

	if (
		node?.type === 'TemplateLiteral' &&
		node.expressions.length === 0 &&
		node.quasis.length === 1
	) {
		return node.quasis[ 0 ].value.cooked;
	}

	return null;
}

function getModuleSource( node ) {
	if ( node.type === 'TSImportEqualsDeclaration' ) {
		return getStaticStringValue( node.moduleReference?.expression );
	}

	if (
		node.type !== 'ImportExpression' &&
		node.type !== 'ImportDeclaration' &&
		node.type !== 'ExportAllDeclaration' &&
		node.type !== 'ExportNamedDeclaration'
	) {
		return null;
	}

	return getStaticStringValue( node.source );
}

function traverseAst( node, visitorKeys, visitor ) {
	if ( ! node?.type ) {
		return;
	}

	visitor( node );

	for ( const key of visitorKeys[ node.type ] ?? [] ) {
		const child = node[ key ];
		if ( Array.isArray( child ) ) {
			child.forEach( ( item ) =>
				traverseAst( item, visitorKeys, visitor )
			);
		} else if ( child?.type ) {
			traverseAst( child, visitorKeys, visitor );
		}
	}
}

function createParentNodeMap( ast, visitorKeys ) {
	const parentNodes = new WeakMap();
	const visit = ( node ) => {
		for ( const key of visitorKeys[ node.type ] ?? [] ) {
			const children = Array.isArray( node[ key ] )
				? node[ key ]
				: [ node[ key ] ];
			for ( const child of children ) {
				if ( child?.type ) {
					parentNodes.set( child, node );
					visit( child );
				}
			}
		}
	};
	visit( ast );
	return parentNodes;
}

function getTrackedAssignment( node ) {
	if ( node.type === 'VariableDeclarator' ) {
		return {
			target: node.id,
			value: node.init,
			isCollectionElement: false,
		};
	}
	if ( node.type === 'AssignmentExpression' && node.operator === '=' ) {
		return {
			target: node.left,
			value: node.right,
			isCollectionElement: false,
		};
	}
	if ( node.type === 'ForOfStatement' ) {
		const target =
			node.left.type === 'VariableDeclaration'
				? node.left.declarations[ 0 ]?.id
				: node.left;
		return { target, value: node.right, isCollectionElement: true };
	}
	return { target: null, value: null, isCollectionElement: false };
}

function getBranchPath( node, useNode, parentNodes ) {
	const useAncestors = new Set();
	for (
		let ancestor = useNode;
		ancestor;
		ancestor = parentNodes.get( ancestor )
	) {
		useAncestors.add( ancestor );
	}

	const branches = [];
	for ( let child = node; parentNodes.has( child );  ) {
		const parent = parentNodes.get( child );
		if ( useAncestors.has( parent ) ) {
			break;
		}
		let branch = null;
		if ( parent.type === 'IfStatement' ) {
			branch = child === parent.consequent ? 'then' : 'else';
		} else if ( parent.type === 'ConditionalExpression' ) {
			branch = child === parent.consequent ? 'then' : 'else';
		} else if (
			parent.type === 'LogicalExpression' &&
			child === parent.right
		) {
			branch = 'right';
		} else if ( parent.type === 'SwitchCase' ) {
			branch = parent.range.join( ':' );
		} else if (
			[
				'DoWhileStatement',
				'ForInStatement',
				'ForOfStatement',
				'ForStatement',
				'WhileStatement',
			].includes( parent.type ) &&
			child === parent.body
		) {
			branch = 'body';
		}
		if ( branch ) {
			branches.push( `${ parent.range.join( ':' ) }:${ branch }` );
		}
		child = parent;
	}
	return branches.reverse().join( '/' );
}

function getExecutionContext( node, parentNodes ) {
	for ( let current = node; current; current = parentNodes.get( current ) ) {
		if (
			[
				'ArrowFunctionExpression',
				'FunctionDeclaration',
				'FunctionExpression',
				'Program',
			].includes( current.type )
		) {
			return current;
		}
	}
	return null;
}

function getFunctionVariable( functionNode, identifierVariables, parentNodes ) {
	if ( functionNode.type === 'FunctionDeclaration' ) {
		return identifierVariables.get( functionNode.id );
	}
	const parent = parentNodes.get( functionNode );
	return parent?.type === 'VariableDeclarator' &&
		parent.id.type === 'Identifier'
		? identifierVariables.get( parent.id )
		: null;
}

function getDirectFunctionCalls(
	functionNode,
	useNode,
	identifierVariables,
	parentNodes
) {
	const variable = getFunctionVariable(
		functionNode,
		identifierVariables,
		parentNodes
	);
	const useContext = getExecutionContext( useNode, parentNodes );
	return ( variable?.references ?? [] )
		.map( ( reference ) => reference.identifier )
		.filter(
			( identifier ) =>
				identifier.range[ 0 ] < useNode.range[ 0 ] &&
				getExecutionContext( identifier, parentNodes ) === useContext &&
				parentNodes.get( identifier )?.type === 'CallExpression' &&
				parentNodes.get( identifier ).callee === identifier
		);
}

function selectReachableWrites( writes ) {
	writes.sort( ( first, second ) => first.position - second.position );
	const lastUnconditionalWrite = writes
		.filter( ( write ) => ! write.branchPath )
		.at( -1 );
	const conditionalWrites = new Map();
	for ( const write of writes ) {
		if (
			write.branchPath &&
			write.position > ( lastUnconditionalWrite?.position ?? -1 )
		) {
			conditionalWrites.set( write.branchPath, write );
		}
	}
	const conditionalPaths = new Set( conditionalWrites.keys() );
	const hasExhaustiveReplacement = [ ...conditionalPaths ].some(
		( branchPath ) =>
			branchPath.endsWith( ':then' ) &&
			conditionalPaths.has(
				`${ branchPath.slice( 0, -':then'.length ) }:else`
			)
	);
	const reachableWrites =
		lastUnconditionalWrite && ! hasExhaustiveReplacement
			? [ lastUnconditionalWrite ]
			: [];
	return {
		hasExhaustiveReplacement,
		writes: reachableWrites.concat( [ ...conditionalWrites.values() ] ),
	};
}

function getReachableWrites(
	variable,
	useNode,
	identifierVariables,
	parentNodes
) {
	const usePosition = useNode.range[ 0 ];
	const writes = variable.references
		.filter( ( reference ) => reference.isWrite() && reference.writeExpr )
		.flatMap( ( reference ) => {
			const writeContext = getExecutionContext(
				reference.identifier,
				parentNodes
			);
			const useContext = getExecutionContext( useNode, parentNodes );
			const executionNodes =
				writeContext === useContext
					? [ reference.identifier ]
					: getDirectFunctionCalls(
							writeContext,
							useNode,
							identifierVariables,
							parentNodes
					  );
			return executionNodes.map( ( executionNode ) => ( {
				expression: reference.writeExpr,
				node: executionNode,
				position: executionNode.range[ 0 ],
				branchPath: getBranchPath(
					executionNode,
					useNode,
					parentNodes
				),
			} ) );
		} )
		.filter( ( write ) => write.position < usePosition );
	return selectReachableWrites( writes ).writes;
}

function getReachableMemberWrites(
	node,
	useNode,
	identifierVariables,
	parentNodes
) {
	if ( node.object.type !== 'Identifier' ) {
		return { hasExhaustiveReplacement: false, writes: [] };
	}
	const variable = identifierVariables.get( node.object );
	const propertyName = getMemberPropertyName( node );
	const usePosition = useNode.range[ 0 ];
	const writes = ( variable?.references ?? [] ).flatMap( ( reference ) => {
		const member = parentNodes.get( reference.identifier );
		const assignment = parentNodes.get( member );
		if (
			member?.type !== 'MemberExpression' ||
			member.object !== reference.identifier ||
			getMemberPropertyName( member ) !== propertyName ||
			assignment?.type !== 'AssignmentExpression' ||
			assignment.left !== member ||
			assignment.operator !== '='
		) {
			return [];
		}
		const writeContext = getExecutionContext(
			reference.identifier,
			parentNodes
		);
		const useContext = getExecutionContext( useNode, parentNodes );
		const executionNodes =
			writeContext === useContext
				? [ reference.identifier ]
				: getDirectFunctionCalls(
						writeContext,
						useNode,
						identifierVariables,
						parentNodes
				  );
		return executionNodes
			.filter(
				( executionNode ) => executionNode.range[ 0 ] < usePosition
			)
			.map( ( executionNode ) => ( {
				expression: assignment.right,
				node: executionNode,
				position: executionNode.range[ 0 ],
				branchPath: getBranchPath(
					executionNode,
					useNode,
					parentNodes
				),
			} ) );
	} );
	return selectReachableWrites( writes );
}

function getReachableLocalValues(
	node,
	useNode,
	identifierVariables,
	parentNodes,
	seenVariables = new Set()
) {
	const localValues = new Set();
	if (
		[
			'ArrowFunctionExpression',
			'FunctionDeclaration',
			'FunctionExpression',
			'ObjectExpression',
		].includes( node?.type )
	) {
		localValues.add( node );
		return localValues;
	}
	if (
		[ 'ConditionalExpression', 'LogicalExpression' ].includes( node?.type )
	) {
		const branches =
			node.type === 'ConditionalExpression'
				? [ node.consequent, node.alternate ]
				: [ node.left, node.right ];
		for ( const branch of branches ) {
			for ( const value of getReachableLocalValues(
				branch,
				useNode,
				identifierVariables,
				parentNodes,
				seenVariables
			) ) {
				localValues.add( value );
			}
		}
		return localValues;
	}
	if (
		[
			'AssignmentExpression',
			'ChainExpression',
			'TSAsExpression',
			'TSNonNullExpression',
			'TSTypeAssertion',
		].includes( node?.type )
	) {
		return getReachableLocalValues(
			node.type === 'AssignmentExpression' ? node.right : node.expression,
			useNode,
			identifierVariables,
			parentNodes,
			seenVariables
		);
	}
	if ( node?.type === 'SequenceExpression' ) {
		return getReachableLocalValues(
			node.expressions.at( -1 ),
			useNode,
			identifierVariables,
			parentNodes,
			seenVariables
		);
	}
	if (
		node?.type === 'CallExpression' &&
		node.callee?.type === 'MemberExpression' &&
		getMemberPropertyName( node.callee ) === 'bind'
	) {
		const boundArgumentCount = Math.max( 0, node.arguments.length - 1 );
		for ( const value of getReachableLocalValues(
			node.callee.object,
			useNode,
			identifierVariables,
			parentNodes,
			seenVariables
		) ) {
			if ( value.type === 'BoundFunction' ) {
				localValues.add( {
					...value,
					boundArgumentCount:
						value.boundArgumentCount + boundArgumentCount,
				} );
			} else if (
				[
					'ArrowFunctionExpression',
					'FunctionDeclaration',
					'FunctionExpression',
				].includes( value.type )
			) {
				localValues.add( {
					type: 'BoundFunction',
					functionNode: value,
					boundArgumentCount,
				} );
			}
		}
		return localValues;
	}
	if ( node?.type === 'MemberExpression' ) {
		const propertyName = getMemberPropertyName( node );
		const memberWrites = getReachableMemberWrites(
			node,
			useNode,
			identifierVariables,
			parentNodes
		);
		const hasUnconditionalMemberWrite = memberWrites.writes.some(
			( write ) => ! write.branchPath
		);
		if (
			! hasUnconditionalMemberWrite &&
			! memberWrites.hasExhaustiveReplacement
		) {
			for ( const object of getReachableLocalValues(
				node.object,
				useNode,
				identifierVariables,
				parentNodes,
				seenVariables
			) ) {
				if ( object.type !== 'ObjectExpression' ) {
					continue;
				}
				for ( const property of object.properties ) {
					if (
						property.type === 'Property' &&
						( property.key?.name ?? property.key?.value ) ===
							propertyName
					) {
						for ( const value of getReachableLocalValues(
							property.value,
							useNode,
							identifierVariables,
							parentNodes,
							seenVariables
						) ) {
							localValues.add( value );
						}
					}
				}
			}
		}
		for ( const write of memberWrites.writes ) {
			for ( const value of getReachableLocalValues(
				write.expression,
				write.node,
				identifierVariables,
				parentNodes,
				seenVariables
			) ) {
				localValues.add( value );
			}
		}
		return localValues;
	}
	if ( node?.type !== 'Identifier' ) {
		return localValues;
	}

	const variable = identifierVariables.get( node );
	if ( ! variable || seenVariables.has( variable ) ) {
		return localValues;
	}
	const nextSeenVariables = new Set( seenVariables ).add( variable );
	for ( const write of getReachableWrites(
		variable,
		useNode,
		identifierVariables,
		parentNodes
	) ) {
		for ( const value of getReachableLocalValues(
			write.expression,
			write.node,
			identifierVariables,
			parentNodes,
			nextSeenVariables
		) ) {
			localValues.add( value );
		}
	}
	if ( ! localValues.size ) {
		for ( const definition of variable.defs ?? [] ) {
			if ( definition.node.type === 'FunctionDeclaration' ) {
				localValues.add( definition.node );
			}
		}
	}
	return localValues;
}

function getReachableLocalFunctions( node, identifierVariables, parentNodes ) {
	return new Set(
		[
			...getReachableLocalValues(
				node,
				node,
				identifierVariables,
				parentNodes
			),
		].flatMap( ( value ) => {
			if ( value.type === 'BoundFunction' ) {
				return value;
			}
			return [
				'ArrowFunctionExpression',
				'FunctionDeclaration',
				'FunctionExpression',
			].includes( value.type )
				? {
						type: 'BoundFunction',
						functionNode: value,
						boundArgumentCount: 0,
				  }
				: [];
		} )
	);
}

function isRecord( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

/**
 * Validate the shape and project ownership of Vitest policy exceptions.
 *
 * @param {unknown}     options
 * @param {Object}      projects
 * @param {Set<string>} projects.browserTests
 * @param {Set<string>} projects.jsdomTests
 * @param {Object}      [projects.usedExceptions]
 * @return {string[]} Policy exception violations.
 */
export function validateVitestPolicyExceptions(
	options,
	{ browserTests, jsdomTests, usedExceptions }
) {
	if ( ! isRecord( options ) ) {
		return [ 'Vitest policy exceptions must be an object' ];
	}

	const violations = [];
	const unsupportedKeys = Object.keys( options ).filter(
		( key ) => ! policyExceptionKeys.has( key )
	);
	if ( unsupportedKeys.length ) {
		violations.push(
			`Vitest policy exception file contains unsupported keys: ${ unsupportedKeys.join(
				', '
			) }`
		);
	}

	for ( const [ exceptionName, projectTests ] of [
		[ 'browserFireEvent', browserTests ],
		[ 'jsdomBrowserApis', jsdomTests ],
	] ) {
		const exceptions = options[ exceptionName ];
		if ( ! isRecord( exceptions ) ) {
			violations.push( `${ exceptionName } must be an object` );
			continue;
		}

		for ( const [ file, reason ] of Object.entries( exceptions ) ) {
			if ( typeof reason !== 'string' || reason.trim() === '' ) {
				violations.push(
					`${ file }: ${ exceptionName } exceptions require a non-empty reason`
				);
			}
			if ( ! projectTests.has( file ) ) {
				violations.push(
					`${ file }: ${ exceptionName } entry does not match its Vitest project`
				);
			} else if (
				usedExceptions?.[ exceptionName ] instanceof Set &&
				! usedExceptions[ exceptionName ].has( file )
			) {
				violations.push(
					`${ file }: ${ exceptionName } exception is no longer needed`
				);
			}
		}
	}

	return violations;
}

/**
 * Validate policy rules that distinguish Node, jsdom, and Browser Mode tests.
 *
 * @param {Object}      options
 * @param {string}      options.file
 * @param {string}      options.source
 * @param {string}      options.project
 * @param {boolean}     [options.allowBrowserFireEvent]
 * @param {boolean}     [options.allowJsdomBrowserApis]
 * @param {boolean}     [options.isVitestTest]
 * @param {Set<string>} [options.usedExceptions]
 * @return {string[]} Policy violations.
 */
export function validateVitestPolicy( {
	file,
	source,
	project,
	allowBrowserFireEvent = false,
	allowJsdomBrowserApis = false,
	isVitestTest = false,
	usedExceptions,
} ) {
	let parsedSource;
	try {
		parsedSource = typescriptEslintParser.parseForESLint( source, {
			filePath: file,
			jsxFragmentName: null,
			jsxPragma: null,
			loc: true,
			range: true,
			comment: true,
			sourceType: 'module',
		} );
	} catch ( error ) {
		const message =
			error instanceof Error ? error.message : String( error );
		return [ `${ file }: unable to parse: ${ message }` ];
	}

	const { ast, scopeManager, visitorKeys } = parsedSource;
	const parentNodes = createParentNodeMap( ast, visitorKeys );
	const unboundIdentifiers = new Set(
		scopeManager.globalScope?.through.map(
			( reference ) => reference.identifier
		) ?? []
	);
	const identifierVariables = createIdentifierVariableMap( scopeManager );
	const typeOnlyNodes = new Set(
		scopeManager.globalScope?.through
			.filter(
				( reference ) =>
					reference.isTypeReference && ! reference.isValueReference
			)
			.map( ( reference ) => reference.identifier ) ?? []
	);
	traverseAst( ast, visitorKeys, ( node ) => {
		if ( node.type === 'TSTypeQuery' ) {
			traverseAst( node, visitorKeys, ( typeNode ) => {
				typeOnlyNodes.add( typeNode );
			} );
		}
	} );
	const importedNamespaces = new Set();
	const computedStyleVariables = new Set();
	const domCollectionVariables = new Set();
	const domVariables = new Set();
	const testingLibraryAsyncCollectionFunctionVariables = new Set();
	const testingLibraryAsyncDomFunctionVariables = new Set();
	const testingLibraryCollectionFunctionVariables = new Set();
	const testingLibraryDomFunctionVariables = new Set();
	const testingLibraryFireEventVariables = new Set();
	const testingLibraryNamespaceVariables = new Set();
	const testingLibraryQueryContainerFunctionVariables = new Set();
	// This set contains `screen` bindings and query container expressions or
	// bindings returned by `render` and `within`.
	const testingLibraryScreenVariables = new Set();
	const vitestExpectVariables = new Set();
	const vitestNamespaceVariables = new Set();
	const vitestViVariables = new Set();
	const windowVariables = new Set();
	const violations = [];
	const reported = new Set();
	let hasVitestCollectorImport = false;

	const report = ( category, message, node ) => {
		const exceptionName = {
			'browser-fire-event': allowBrowserFireEvent
				? 'browserFireEvent'
				: null,
			'jsdom-browser-api': allowJsdomBrowserApis
				? 'jsdomBrowserApis'
				: null,
		}[ category ];
		if ( exceptionName ) {
			usedExceptions?.add( exceptionName );
			return;
		}

		if ( reported.has( category ) ) {
			return;
		}
		reported.add( category );
		violations.push(
			`${ file }:${ node?.loc.start.line ?? 1 } ${ message }`
		);
	};
	const reportJsdomBrowserApi = ( node ) =>
		report(
			'jsdom-browser-api',
			'layout, geometry, viewport, observer, animation, and scroll APIs require Browser Mode or an explicit jsdom exception with a concrete reason',
			node
		);
	const trackDomValuePattern = ( target ) => {
		if ( ! target ) {
			return;
		}
		if ( target.type === 'Identifier' ) {
			const variable = identifierVariables.get( target );
			if ( variable ) {
				domVariables.add( variable );
			}
			return;
		}
		if ( target.type === 'AssignmentPattern' ) {
			trackDomValuePattern( target.left );
			return;
		}
		if ( target.type === 'ObjectPattern' ) {
			for ( const property of target.properties ) {
				if ( property.type !== 'Property' ) {
					continue;
				}
				const propertyName = property.key?.name ?? property.key?.value;
				if ( browserApiProperties.has( propertyName ) ) {
					reportJsdomBrowserApi( property );
				} else if ( domProducingProperties.has( propertyName ) ) {
					trackDomValuePattern( property.value );
				}
			}
		}
	};

	for ( const node of ast.body ) {
		if ( node.type !== 'ImportDeclaration' ) {
			continue;
		}

		const importSource = node.source.value;
		const isTestingLibraryImport = [
			'@testing-library/dom',
			'@testing-library/react',
		].includes( importSource );
		const runtimeSpecifiers = node.specifiers.filter(
			( specifier ) =>
				node.importKind !== 'type' && specifier.importKind !== 'type'
		);
		if (
			isVitestTest &&
			importSource === 'vitest' &&
			runtimeSpecifiers.some(
				( specifier ) =>
					specifier.type === 'ImportNamespaceSpecifier' ||
					vitestCollectorApiNames.has( getImportedName( specifier ) )
			)
		) {
			hasVitestCollectorImport = true;
		}
		for ( const specifier of node.specifiers ) {
			const variable = identifierVariables.get( specifier.local );
			if ( specifier.type === 'ImportNamespaceSpecifier' ) {
				if ( variable ) {
					importedNamespaces.add( variable );
				}
				if ( isTestingLibraryImport ) {
					if ( variable ) {
						testingLibraryNamespaceVariables.add( variable );
					}
				}
			}
			if ( isTestingLibraryImport && variable ) {
				const importedName = getImportedName( specifier );
				if ( importedName === 'screen' ) {
					testingLibraryScreenVariables.add( variable );
				} else if (
					testingLibraryAsyncCollectionQueryPattern.test(
						importedName ?? ''
					)
				) {
					testingLibraryAsyncCollectionFunctionVariables.add(
						variable
					);
				} else if (
					testingLibraryAsyncQueryPattern.test( importedName ?? '' )
				) {
					testingLibraryAsyncDomFunctionVariables.add( variable );
				} else if (
					testingLibraryCollectionQueryPattern.test(
						importedName ?? ''
					)
				) {
					testingLibraryCollectionFunctionVariables.add( variable );
				} else if (
					testingLibraryQueryPattern.test( importedName ?? '' )
				) {
					testingLibraryDomFunctionVariables.add( variable );
				} else if ( importedName === 'fireEvent' ) {
					testingLibraryFireEventVariables.add( variable );
				} else if ( [ 'render', 'within' ].includes( importedName ) ) {
					testingLibraryQueryContainerFunctionVariables.add(
						variable
					);
				}
			}
			if ( importSource === 'vitest' ) {
				if ( specifier.type === 'ImportNamespaceSpecifier' ) {
					if ( variable ) {
						vitestNamespaceVariables.add( variable );
					}
				} else if ( getImportedName( specifier ) === 'expect' ) {
					if ( variable ) {
						vitestExpectVariables.add( variable );
					}
				} else if ( getImportedName( specifier ) === 'vi' ) {
					if ( variable ) {
						vitestViVariables.add( variable );
					}
				}
			}
		}

		if (
			project === 'browser' &&
			importSource === '@testing-library/user-event'
		) {
			report(
				'browser-user-event',
				"Browser tests must import { userEvent } from 'vitest/browser'",
				node
			);
		}

		if (
			project === 'browser' &&
			[ '@testing-library/dom', '@testing-library/react' ].includes(
				importSource
			) &&
			node.specifiers.some(
				( specifier ) => getImportedName( specifier ) === 'fireEvent'
			)
		) {
			report(
				'browser-fire-event',
				'Browser tests must use userEvent or locators; allow fireEvent only when the low-level event is the contract',
				node
			);
		}
	}

	let previousTrackedVariableCount = -1;
	while (
		previousTrackedVariableCount !==
		importedNamespaces.size +
			computedStyleVariables.size +
			domCollectionVariables.size +
			domVariables.size +
			testingLibraryAsyncCollectionFunctionVariables.size +
			testingLibraryAsyncDomFunctionVariables.size +
			testingLibraryCollectionFunctionVariables.size +
			testingLibraryDomFunctionVariables.size +
			testingLibraryFireEventVariables.size +
			testingLibraryNamespaceVariables.size +
			testingLibraryQueryContainerFunctionVariables.size +
			testingLibraryScreenVariables.size +
			vitestExpectVariables.size +
			vitestNamespaceVariables.size +
			vitestViVariables.size +
			windowVariables.size
	) {
		previousTrackedVariableCount =
			importedNamespaces.size +
			computedStyleVariables.size +
			domCollectionVariables.size +
			domVariables.size +
			testingLibraryAsyncCollectionFunctionVariables.size +
			testingLibraryAsyncDomFunctionVariables.size +
			testingLibraryCollectionFunctionVariables.size +
			testingLibraryDomFunctionVariables.size +
			testingLibraryFireEventVariables.size +
			testingLibraryNamespaceVariables.size +
			testingLibraryQueryContainerFunctionVariables.size +
			testingLibraryScreenVariables.size +
			vitestExpectVariables.size +
			vitestNamespaceVariables.size +
			vitestViVariables.size +
			windowVariables.size;
		traverseAst( ast, visitorKeys, ( node ) => {
			if (
				isTestingLibraryQueryContainerExpression(
					node,
					testingLibraryQueryContainerFunctionVariables,
					testingLibraryNamespaceVariables,
					identifierVariables
				)
			) {
				testingLibraryScreenVariables.add( node );
			}
			const callbacks =
				node.type === 'CallExpression'
					? getReachableLocalFunctions(
							node.arguments[ 0 ],
							identifierVariables,
							parentNodes
					  )
					: new Set();
			if (
				node.type === 'CallExpression' &&
				node.callee?.type === 'MemberExpression' &&
				domCollectionCallbackElementParameterIndexes.has(
					getMemberPropertyName( node.callee )
				) &&
				( isVariableReference(
					node.callee.object,
					domCollectionVariables,
					identifierVariables
				) ||
					isTestingLibraryDomCollectionExpression(
						node.callee.object,
						testingLibraryScreenVariables,
						testingLibraryCollectionFunctionVariables,
						testingLibraryAsyncCollectionFunctionVariables,
						testingLibraryNamespaceVariables,
						identifierVariables
					) ) &&
				callbacks.size
			) {
				const elementParameterIndex =
					domCollectionCallbackElementParameterIndexes.get(
						getMemberPropertyName( node.callee )
					);
				for ( const callback of callbacks ) {
					trackDomValuePattern(
						callback.functionNode.params[
							elementParameterIndex + callback.boundArgumentCount
						]
					);
				}
			}

			const { target, value, isCollectionElement } =
				getTrackedAssignment( node );

			if ( ! value || ! target ) {
				return;
			}

			if (
				target.type === 'Identifier' &&
				isVariableReference(
					value,
					importedNamespaces,
					identifierVariables
				)
			) {
				const variable = identifierVariables.get( target );
				if ( variable ) {
					importedNamespaces.add( variable );
				}
			}

			if ( target.type === 'Identifier' ) {
				const targetVariable = identifierVariables.get( target );
				for ( const variables of [
					testingLibraryQueryContainerFunctionVariables,
					testingLibraryNamespaceVariables,
					testingLibraryScreenVariables,
					vitestExpectVariables,
					vitestNamespaceVariables,
					vitestViVariables,
				] ) {
					if (
						targetVariable &&
						isVariableReference(
							value,
							variables,
							identifierVariables
						)
					) {
						variables.add( targetVariable );
					}
				}
			}

			if (
				isVariableReference(
					value,
					vitestNamespaceVariables,
					identifierVariables
				)
			) {
				for ( const [ propertyName, variables ] of [
					[ 'expect', vitestExpectVariables ],
					[ 'vi', vitestViVariables ],
				] ) {
					for ( const identifier of getObjectPatternPropertyIdentifiers(
						target,
						propertyName
					) ) {
						const variable = identifierVariables.get( identifier );
						if ( variable ) {
							variables.add( variable );
						}
					}
				}
			}

			if (
				isVariableReference(
					value,
					testingLibraryNamespaceVariables,
					identifierVariables
				)
			) {
				for ( const [ propertyName, variables ] of [
					[ 'fireEvent', testingLibraryFireEventVariables ],
					[ 'render', testingLibraryQueryContainerFunctionVariables ],
					[ 'screen', testingLibraryScreenVariables ],
					[ 'within', testingLibraryQueryContainerFunctionVariables ],
				] ) {
					for ( const identifier of getObjectPatternPropertyIdentifiers(
						target,
						propertyName
					) ) {
						const variable = identifierVariables.get( identifier );
						if ( variable ) {
							variables.add( variable );
						}
					}
				}

				for ( const property of target.properties ?? [] ) {
					if ( property.type !== 'Property' ) {
						continue;
					}
					const propertyName =
						property.key?.name ?? property.key?.value ?? '';
					const variables = getTestingLibraryQueryVariables(
						propertyName,
						{
							asyncCollectionVariables:
								testingLibraryAsyncCollectionFunctionVariables,
							asyncDomVariables:
								testingLibraryAsyncDomFunctionVariables,
							collectionVariables:
								testingLibraryCollectionFunctionVariables,
							domVariables: testingLibraryDomFunctionVariables,
						}
					);
					if ( ! variables ) {
						continue;
					}
					for ( const identifier of getPatternIdentifiers(
						property.value
					) ) {
						const variable = identifierVariables.get( identifier );
						if ( variable ) {
							variables.add( variable );
						}
					}
				}
			}

			const isTestingLibraryQueryContainer =
				isVariableReference(
					value,
					testingLibraryScreenVariables,
					identifierVariables
				) ||
				isTestingLibraryQueryContainerExpression(
					value,
					testingLibraryQueryContainerFunctionVariables,
					testingLibraryNamespaceVariables,
					identifierVariables
				);
			if ( isTestingLibraryQueryContainer ) {
				if ( target.type === 'Identifier' ) {
					const variable = identifierVariables.get( target );
					if ( variable ) {
						testingLibraryScreenVariables.add( variable );
					}
				}

				for ( const property of target.properties ?? [] ) {
					if ( property.type !== 'Property' ) {
						continue;
					}
					const propertyName =
						property.key?.name ?? property.key?.value ?? '';
					if (
						testingLibraryResultDomProperties.has( propertyName )
					) {
						for ( const identifier of getPatternIdentifiers(
							property.value
						) ) {
							const variable =
								identifierVariables.get( identifier );
							if ( variable ) {
								domVariables.add( variable );
							}
						}
						continue;
					}

					const variables = getTestingLibraryQueryVariables(
						propertyName,
						{
							asyncCollectionVariables:
								testingLibraryAsyncCollectionFunctionVariables,
							asyncDomVariables:
								testingLibraryAsyncDomFunctionVariables,
							collectionVariables:
								testingLibraryCollectionFunctionVariables,
							domVariables: testingLibraryDomFunctionVariables,
						}
					);
					if ( ! variables ) {
						continue;
					}
					for ( const identifier of getPatternIdentifiers(
						property.value
					) ) {
						const variable = identifierVariables.get( identifier );
						if ( variable ) {
							variables.add( variable );
						}
					}
				}
			}

			const isWindowValue = isWindowReference(
				value,
				unboundIdentifiers,
				windowVariables,
				identifierVariables
			);
			if ( target.type === 'Identifier' && isWindowValue ) {
				const variable = identifierVariables.get( target );
				if ( variable ) {
					windowVariables.add( variable );
				}
			}

			const computedStyleTargets = [
				...( isComputedStyleReference(
					value,
					unboundIdentifiers,
					computedStyleVariables,
					windowVariables,
					identifierVariables
				)
					? getPatternIdentifiers( target )
					: [] ),
				...( isWindowValue
					? getObjectPatternPropertyIdentifiers(
							target,
							'getComputedStyle'
					  )
					: [] ),
			];
			for ( const identifier of computedStyleTargets ) {
				const variable = identifierVariables.get( identifier );
				if ( variable ) {
					computedStyleVariables.add( variable );
				}
			}

			const isDomCollectionValue =
				isVariableReference(
					value,
					domCollectionVariables,
					identifierVariables
				) ||
				isTestingLibraryDomCollectionExpression(
					value.type === 'AwaitExpression' ? value.argument : value,
					testingLibraryScreenVariables,
					testingLibraryCollectionFunctionVariables,
					testingLibraryAsyncCollectionFunctionVariables,
					testingLibraryNamespaceVariables,
					identifierVariables,
					value.type === 'AwaitExpression'
				);
			if ( isDomCollectionValue ) {
				if ( isCollectionElement ) {
					trackDomValuePattern( target );
				} else if ( target.type === 'Identifier' ) {
					const variable = identifierVariables.get( target );
					if ( variable ) {
						domCollectionVariables.add( variable );
					}
				} else if ( target.type === 'ArrayPattern' ) {
					for ( const identifier of getPatternIdentifiers(
						target
					) ) {
						const variable = identifierVariables.get( identifier );
						if ( variable ) {
							domVariables.add( variable );
						}
					}
				}
			}

			if (
				! isBrowserGlobalExpression(
					value,
					unboundIdentifiers,
					domVariables,
					domCollectionVariables,
					identifierVariables,
					windowVariables,
					testingLibraryScreenVariables,
					testingLibraryDomFunctionVariables,
					testingLibraryAsyncDomFunctionVariables,
					testingLibraryCollectionFunctionVariables,
					testingLibraryAsyncCollectionFunctionVariables,
					testingLibraryNamespaceVariables
				)
			) {
				return;
			}

			trackDomValuePattern( target );
		} );
	}

	traverseAst( ast, visitorKeys, ( node ) => {
		if (
			project === 'browser' &&
			node.type === 'Identifier' &&
			isVariableReference(
				node,
				testingLibraryFireEventVariables,
				identifierVariables
			)
		) {
			report(
				'browser-fire-event',
				'Browser tests must use userEvent or locators; allow fireEvent only when the low-level event is the contract',
				node
			);
		}

		if (
			project === 'browser' &&
			node.type === 'MemberExpression' &&
			getMemberPropertyName( node ) === 'fireEvent' &&
			isVariableReference(
				node.object,
				testingLibraryNamespaceVariables,
				identifierVariables
			)
		) {
			report(
				'browser-fire-event',
				'Browser tests must use userEvent or locators; allow fireEvent only when the low-level event is the contract',
				node
			);
		}

		const moduleSource = getModuleSource( node );
		if (
			isVitestTest &&
			competingTestRunnerModules.has( moduleSource ) &&
			hasRuntimeModuleReference( node )
		) {
			report(
				'competing-test-runner-import',
				`test APIs must come from vitest, not ${ moduleSource }`,
				node
			);
		}

		if ( isVitestTest && moduleSource === 'vitest/globals' ) {
			report( 'vitest-globals', 'vitest/globals is not allowed', node );
		}

		if (
			isVitestTest &&
			project !== 'browser' &&
			browserModeModules.has( moduleSource )
		) {
			report(
				'browser-mode-import',
				'Browser Mode imports require a *.browser.test.* filename',
				node
			);
		}

		if (
			project === 'browser' &&
			moduleSource &&
			isBuiltin( moduleSource ) &&
			hasRuntimeModuleReference( node )
		) {
			report(
				'browser-node-builtin',
				'Browser tests cannot import Node built-ins at runtime',
				node
			);
		}

		if (
			node.type === 'TSImportEqualsDeclaration' &&
			node.importKind !== 'type'
		) {
			report( 'commonjs-import', 'CommonJS import', node );
		}

		if (
			node.type === 'TSExportAssignment' ||
			( node.type === 'AssignmentExpression' &&
				isCommonJsExport( node.left, unboundIdentifiers ) )
		) {
			report( 'commonjs-export', 'CommonJS export', node );
		}

		if (
			node.type === 'CallExpression' &&
			isUnboundIdentifier( node.callee, 'require', unboundIdentifiers )
		) {
			report( 'unbound-require', 'unbound require()', node );
		}

		if (
			/\.tsx?$/.test( file ) &&
			node.type === 'CallExpression' &&
			node.callee?.type === 'MemberExpression' &&
			isImportedApiReference(
				node.callee.object,
				'vi',
				vitestViVariables,
				vitestNamespaceVariables,
				identifierVariables
			) &&
			getMemberPropertyName( node.callee ) === 'mock' &&
			! isDynamicImport( node.arguments[ 0 ] )
		) {
			report(
				'typescript-vi-mock',
				'TypeScript vi.mock() must use vi.mock(import(...))',
				node
			);
		}

		if (
			project === 'jsdom' &&
			node.type === 'CallExpression' &&
			isComputedStyleReference(
				node.callee,
				unboundIdentifiers,
				computedStyleVariables,
				windowVariables,
				identifierVariables
			)
		) {
			report(
				'jsdom-computed-style',
				'computed style assertions require a *.browser.test.* filename',
				node
			);
		}

		if (
			project === 'jsdom' &&
			isVitestMatcherCall(
				node,
				'toHaveStyle',
				vitestExpectVariables,
				vitestNamespaceVariables,
				identifierVariables
			)
		) {
			report(
				'jsdom-style-matcher',
				'toHaveStyle() requires a *.browser.test.* filename',
				node
			);
		}

		if (
			isVitestTest &&
			node.type === 'Identifier' &&
			vitestApiNames.has( node.name ) &&
			unboundIdentifiers.has( node )
		) {
			report(
				`unbound-vitest-api-${ node.name }`,
				`unbound Vitest API: ${ node.name }`,
				node
			);
		}

		if (
			project === 'jsdom' &&
			! typeOnlyNodes.has( node ) &&
			( ( node.type === 'Identifier' &&
				browserApiIdentifiers.has( node.name ) &&
				unboundIdentifiers.has( node ) ) ||
				( node.type === 'MemberExpression' &&
					browserApiProperties.has( getMemberPropertyName( node ) ) &&
					( isWindowReference(
						node.object,
						unboundIdentifiers,
						windowVariables,
						identifierVariables
					) ||
						isBrowserGlobalExpression(
							node.object,
							unboundIdentifiers,
							domVariables,
							domCollectionVariables,
							identifierVariables,
							windowVariables,
							testingLibraryScreenVariables,
							testingLibraryDomFunctionVariables,
							testingLibraryAsyncDomFunctionVariables,
							testingLibraryCollectionFunctionVariables,
							testingLibraryAsyncCollectionFunctionVariables,
							testingLibraryNamespaceVariables
						) ) ) )
		) {
			reportJsdomBrowserApi( node );
		}

		if (
			project === 'browser' &&
			node.type === 'CallExpression' &&
			getMemberPropertyName( node.callee ) === 'spyOn' &&
			isImportedApiReference(
				node.callee.object,
				'vi',
				vitestViVariables,
				vitestNamespaceVariables,
				identifierVariables
			) &&
			node.arguments[ 0 ]?.type === 'Identifier' &&
			isVariableReference(
				node.arguments[ 0 ],
				importedNamespaces,
				identifierVariables
			)
		) {
			report(
				'browser-namespace-spy',
				'Browser tests cannot spy on imported ESM namespace objects; mock before import or inject the dependency',
				node
			);
		}
	} );

	if ( isVitestTest && ! hasVitestCollectorImport ) {
		report( 'vitest-import', 'no explicit Vitest collector import' );
	}

	if ( isVitestTest && hasTestEnvironmentOverride( ast.comments ) ) {
		report(
			'test-environment-override',
			'per-file test environment overrides are not allowed; use the filename suffix'
		);
	}

	if (
		isVitestTest &&
		project === 'node' &&
		/\.(?:browser|jsdom)\./.test( file.split( '/' ).at( -1 ) )
	) {
		report(
			'environment-suffix',
			'environment names must use *.jsdom.test.* or *.browser.test.*'
		);
	}

	return violations;
}
