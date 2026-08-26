import { isBuiltin } from 'node:module';
import typescriptEslintParser from '@typescript-eslint/parser';

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
const testingLibraryQueryPattern = /^(?:find|get|query)(?:All)?By/;

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

function isTestingLibraryDomExpression(
	node,
	testingLibraryScreenVariables,
	testingLibraryDomFunctionVariables,
	testingLibraryNamespaceVariables,
	identifierVariables
) {
	if ( node?.type !== 'CallExpression' ) {
		return false;
	}

	if (
		isVariableReference(
			node.callee,
			testingLibraryDomFunctionVariables,
			identifierVariables
		)
	) {
		return true;
	}

	if (
		node.callee?.type !== 'MemberExpression' ||
		! testingLibraryQueryPattern.test(
			getMemberPropertyName( node.callee ) ?? ''
		)
	) {
		return false;
	}

	const receiver = node.callee.object;
	if (
		isVariableReference(
			receiver,
			testingLibraryScreenVariables,
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

function isBrowserGlobalExpression(
	node,
	unboundIdentifiers,
	domVariables,
	identifierVariables,
	testingLibraryScreenVariables,
	testingLibraryDomFunctionVariables,
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
				testingLibraryNamespaceVariables,
				identifierVariables
			)
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
			identifierVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
			testingLibraryNamespaceVariables
		);
	}

	if ( node?.type === 'MemberExpression' ) {
		const propertyName = getMemberPropertyName( node );
		if ( isBrowserGlobalContainer( node.object, unboundIdentifiers ) ) {
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
			identifierVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
			testingLibraryNamespaceVariables
		);
	}

	if ( node?.type === 'ConditionalExpression' ) {
		return (
			isBrowserGlobalExpression(
				node.consequent,
				unboundIdentifiers,
				domVariables,
				identifierVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryNamespaceVariables
			) ||
			isBrowserGlobalExpression(
				node.alternate,
				unboundIdentifiers,
				domVariables,
				identifierVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
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
				identifierVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
				testingLibraryNamespaceVariables
			) ||
			isBrowserGlobalExpression(
				node.right,
				unboundIdentifiers,
				domVariables,
				identifierVariables,
				testingLibraryScreenVariables,
				testingLibraryDomFunctionVariables,
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
			identifierVariables,
			testingLibraryScreenVariables,
			testingLibraryDomFunctionVariables,
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
		( isBrowserGlobalContainer( node.object, unboundIdentifiers ) ||
			( getMemberPropertyName( node.object ) === 'defaultView' &&
				isUnboundIdentifier(
					node.object.object,
					'document',
					unboundIdentifiers
				) ) )
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

function getTrackedAssignment( node ) {
	if ( node.type === 'VariableDeclarator' ) {
		return { target: node.id, value: node.init };
	}
	if ( node.type === 'AssignmentExpression' && node.operator === '=' ) {
		return { target: node.left, value: node.right };
	}
	return { target: null, value: null };
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
	const unboundIdentifiers = new Set(
		scopeManager.globalScope?.through.map(
			( reference ) => reference.identifier
		) ?? []
	);
	const identifierVariables = createIdentifierVariableMap( scopeManager );
	const importedNamespaces = new Set();
	const computedStyleVariables = new Set();
	const domVariables = new Set();
	const testingLibraryDomFunctionVariables = new Set();
	const testingLibraryNamespaceVariables = new Set();
	const testingLibraryScreenVariables = new Set();
	const vitestExpectVariables = new Set();
	const vitestNamespaceVariables = new Set();
	const vitestViVariables = new Set();
	const violations = [];
	const reported = new Set();
	let hasVitestImport = false;

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

	for ( const node of ast.body ) {
		if ( node.type !== 'ImportDeclaration' ) {
			continue;
		}

		const importSource = node.source.value;
		const isTestingLibraryImport = [
			'@testing-library/dom',
			'@testing-library/react',
		].includes( importSource );
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
					testingLibraryQueryPattern.test( importedName ?? '' )
				) {
					testingLibraryDomFunctionVariables.add( variable );
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
			domVariables.size
	) {
		previousTrackedVariableCount =
			importedNamespaces.size +
			computedStyleVariables.size +
			domVariables.size;
		traverseAst( ast, visitorKeys, ( node ) => {
			const { target, value } = getTrackedAssignment( node );

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

			const computedStyleTargets = [
				...( isComputedStyleReference(
					value,
					unboundIdentifiers,
					computedStyleVariables,
					identifierVariables
				)
					? getPatternIdentifiers( target )
					: [] ),
				...( isBrowserGlobalContainer( value, unboundIdentifiers )
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

			if (
				! isBrowserGlobalExpression(
					value,
					unboundIdentifiers,
					domVariables,
					identifierVariables,
					testingLibraryScreenVariables,
					testingLibraryDomFunctionVariables,
					testingLibraryNamespaceVariables
				)
			) {
				return;
			}

			for ( const identifier of getPatternIdentifiers( target ) ) {
				const variable = identifierVariables.get( identifier );
				if ( variable ) {
					domVariables.add( variable );
				}
			}
		} );
	}

	traverseAst( ast, visitorKeys, ( node ) => {
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
		if ( isVitestTest && moduleSource === 'vitest' ) {
			hasVitestImport = true;
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
			( ( node.type === 'Identifier' &&
				browserApiIdentifiers.has( node.name ) &&
				unboundIdentifiers.has( node ) ) ||
				( node.type === 'MemberExpression' &&
					browserApiProperties.has( getMemberPropertyName( node ) ) &&
					( isBrowserGlobalContainer(
						node.object,
						unboundIdentifiers
					) ||
						isBrowserGlobalExpression(
							node.object,
							unboundIdentifiers,
							domVariables,
							identifierVariables,
							testingLibraryScreenVariables,
							testingLibraryDomFunctionVariables,
							testingLibraryNamespaceVariables
						) ) ) )
		) {
			report(
				'jsdom-browser-api',
				'layout, geometry, viewport, observer, animation, and scroll APIs require Browser Mode or an explicit jsdom exception with a concrete reason',
				node
			);
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

	if ( isVitestTest && ! hasVitestImport ) {
		report( 'vitest-import', 'no explicit import from vitest' );
	}

	if (
		isVitestTest &&
		ast.comments?.some( ( comment ) =>
			/^\s*\*?\s*@(jest|vitest)-environment\b/m.test( comment.value )
		)
	) {
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
