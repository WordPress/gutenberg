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
	'clientHeight',
	'clientLeft',
	'clientTop',
	'clientWidth',
	'getBoundingClientRect',
	'getClientRects',
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
	'renderedUi',
] );
const renderedUiImports = new Map( [
	[ '@testing-library/react', new Set( [ 'render', 'renderHook' ] ) ],
	[
		'@wordpress/element',
		new Set( [ 'createRoot', 'hydrate', 'hydrateRoot', 'render' ] ),
	],
	[ 'react-dom', new Set( [ 'hydrate', 'render' ] ) ],
	[ 'react-dom/client', new Set( [ 'createRoot', 'hydrateRoot' ] ) ],
] );

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

function isDynamicImport( node ) {
	return (
		node?.type === 'ImportExpression' ||
		( node?.type === 'CallExpression' && node.callee?.type === 'Import' )
	);
}

function isGlobalGetComputedStyleCall( node, unboundIdentifiers ) {
	if ( node.callee?.type === 'Identifier' ) {
		return isUnboundIdentifier(
			node.callee,
			'getComputedStyle',
			unboundIdentifiers
		);
	}

	return (
		getMemberPropertyName( node.callee ) === 'getComputedStyle' &&
		node.callee.object?.type === 'Identifier' &&
		[ 'globalThis', 'window' ].includes( node.callee.object.name )
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
 * @return {string[]} Policy exception violations.
 */
export function validateVitestPolicyExceptions(
	options,
	{ browserTests, jsdomTests }
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

	if ( ! Array.isArray( options.renderedUi ) ) {
		violations.push( 'renderedUi must be an array of jsdom test paths' );
	} else {
		const renderedUiEntries = options.renderedUi.filter(
			( file ) => typeof file === 'string'
		);
		if ( renderedUiEntries.length !== options.renderedUi.length ) {
			violations.push( 'renderedUi entries must be strings' );
		}
		if ( new Set( renderedUiEntries ).size !== renderedUiEntries.length ) {
			violations.push( 'renderedUi entries must be unique' );
		}
		for ( const file of renderedUiEntries ) {
			if ( ! jsdomTests.has( file ) ) {
				violations.push(
					`${ file }: renderedUi entry does not match its Vitest project`
				);
			}
		}
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
			}
		}
	}

	return violations;
}

/**
 * Validate policy rules that distinguish Node, jsdom, and Browser Mode tests.
 *
 * @param {Object}  options
 * @param {string}  options.file
 * @param {string}  options.source
 * @param {string}  options.project
 * @param {boolean} [options.allowBrowserFireEvent]
 * @param {boolean} [options.allowJsdomBrowserApis]
 * @param {boolean} [options.allowRenderedUi]
 * @param {boolean} [options.isVitestTest]
 * @return {string[]} Policy violations.
 */
export function validateVitestPolicy( {
	file,
	source,
	project,
	allowBrowserFireEvent = false,
	allowJsdomBrowserApis = false,
	allowRenderedUi = false,
	isVitestTest = false,
} ) {
	const { ast, scopeManager, visitorKeys } =
		typescriptEslintParser.parseForESLint( source, {
			filePath: file,
			jsxFragmentName: null,
			jsxPragma: null,
			loc: true,
			range: true,
			comment: true,
			sourceType: 'module',
		} );
	const unboundIdentifiers = new Set(
		scopeManager.globalScope?.through.map(
			( reference ) => reference.identifier
		) ?? []
	);
	const importedNamespaces = new Set();
	const violations = [];
	const reported = new Set();
	let hasVitestImport = false;

	const report = ( category, message, node ) => {
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
		for ( const specifier of node.specifiers ) {
			if ( specifier.type === 'ImportNamespaceSpecifier' ) {
				importedNamespaces.add( specifier.local.name );
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
			) &&
			! allowBrowserFireEvent
		) {
			report(
				'browser-fire-event',
				'Browser tests must use userEvent or locators; allow fireEvent only when the low-level event is the contract',
				node
			);
		}

		const renderedImports = renderedUiImports.get( importSource );
		if (
			project === 'jsdom' &&
			renderedImports &&
			node.specifiers.some( ( specifier ) => {
				const importedName = getImportedName( specifier );
				return (
					renderedImports.has( importedName ) ||
					importedName === 'default' ||
					importedName === '*'
				);
			} ) &&
			! allowRenderedUi
		) {
			report(
				'jsdom-rendered-ui',
				'rendered UI tests default to Browser Mode; use Node for pure logic or add an explicit jsdom baseline entry for low-level DOM semantics',
				node
			);
		}
	}

	traverseAst( ast, visitorKeys, ( node ) => {
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
			node.callee.object?.type === 'Identifier' &&
			node.callee.object.name === 'vi' &&
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
			isGlobalGetComputedStyleCall( node, unboundIdentifiers )
		) {
			report(
				'jsdom-computed-style',
				'computed style assertions require a *.browser.test.* filename',
				node
			);
		}

		if (
			project === 'jsdom' &&
			node.type === 'CallExpression' &&
			getMemberPropertyName( node.callee ) === 'toHaveStyle'
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
			! allowJsdomBrowserApis &&
			( ( node.type === 'Identifier' &&
				browserApiIdentifiers.has( node.name ) &&
				unboundIdentifiers.has( node ) ) ||
				( node.type === 'MemberExpression' &&
					browserApiProperties.has(
						getMemberPropertyName( node )
					) ) )
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
			node.callee.object?.type === 'Identifier' &&
			node.callee.object.name === 'vi' &&
			node.arguments[ 0 ]?.type === 'Identifier' &&
			importedNamespaces.has( node.arguments[ 0 ].name )
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
