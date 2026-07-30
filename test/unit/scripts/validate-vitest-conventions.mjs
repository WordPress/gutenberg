import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createRequire, isBuiltin } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import typescriptEslintParser from '@typescript-eslint/parser';
import globPackage from 'glob';
import {
	discoverTestFiles,
	getVitestProjectName,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './test-projects.mjs';
import { validateVitestPolicy } from './vitest-policy-rules.mjs';

const { sync: glob } = globPackage;
const require = createRequire( import.meta.url );
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const policyExceptions = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/vitest-policy-exceptions.json' ),
		'utf8'
	)
);
const renderedUiBaseline = new Set( policyExceptions.renderedUi );
const discoveredTests = discoverTestFiles( ROOT_DIR );
const vitestTestsByProject = getVitestTestsByProject( ROOT_DIR );
const vitestTests = Object.values( vitestTestsByProject ).flat().sort();
const jsdomTests = new Set( vitestTestsByProject.jsdom );
const browserTests = new Set( vitestTestsByProject.browser );
const allJsdomTests = new Set(
	discoveredTests.filter(
		( file ) => getVitestProjectName( file ) === 'jsdom'
	)
);
const allBrowserTests = new Set(
	discoveredTests.filter(
		( file ) => getVitestProjectName( file ) === 'browser'
	)
);
const vitestInfrastructure = [
	'test/unit/vitest.config.mjs',
	...glob( 'test/unit/config/**/*.vitest*.{js,jsx,mjs,ts,tsx}', {
		cwd: ROOT_DIR,
		nodir: true,
	} ),
	...glob( 'test/unit/scripts/*.mjs', {
		cwd: ROOT_DIR,
		nodir: true,
	} ),
];
const files = [
	...new Set( [ ...vitestTests, ...vitestInfrastructure ] ),
].sort();
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
const environmentTokenPattern = /\.(?:browser|jsdom)\./;
const validEnvironmentSuffixPattern =
	/\.(?:browser|jsdom)\.test\.[cm]?[jt]sx?$/;
const violations = [];

if ( renderedUiBaseline.size !== policyExceptions.renderedUi.length ) {
	violations.push( 'Rendered UI jsdom baseline entries must be unique' );
}
for ( const file of renderedUiBaseline ) {
	if ( ! allJsdomTests.has( file ) ) {
		violations.push(
			`${ file }: rendered UI baseline entries must be jsdom tests`
		);
	}
}
for ( const [ exceptionName, projectTests ] of [
	[ 'browserFireEvent', allBrowserTests ],
	[ 'jsdomBrowserApis', allJsdomTests ],
] ) {
	for ( const [ file, reason ] of Object.entries(
		policyExceptions[ exceptionName ]
	) ) {
		if ( typeof reason !== 'string' || reason.trim().length < 12 ) {
			violations.push(
				`${ file }: ${ exceptionName } exceptions require a concrete reason`
			);
		}
		if ( ! projectTests.has( file ) ) {
			violations.push(
				`${ file }: ${ exceptionName } entry does not match its Vitest project`
			);
		}
	}
}

function resolvePackageBin( packageName ) {
	const packageJsonPath = require.resolve( `${ packageName }/package.json` );
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	const binPath =
		typeof packageJson.bin === 'string'
			? packageJson.bin
			: Object.values( packageJson.bin )[ 0 ];

	return path.resolve( path.dirname( packageJsonPath ), binPath );
}

function isCommonJsExport( node ) {
	if ( node?.type !== 'MemberExpression' ) {
		return false;
	}

	if (
		node.object?.type === 'Identifier' &&
		node.object.name === 'exports'
	) {
		return true;
	}

	return (
		node.object?.type === 'Identifier' &&
		node.object.name === 'module' &&
		node.property?.type === 'Identifier' &&
		node.property.name === 'exports'
	);
}

function isDynamicImport( node ) {
	return (
		node?.type === 'ImportExpression' ||
		( node?.type === 'CallExpression' && node.callee?.type === 'Import' )
	);
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

function isGlobalGetComputedStyleCall( node, unboundIdentifiers ) {
	if ( node.callee?.type === 'Identifier' ) {
		return (
			node.callee.name === 'getComputedStyle' &&
			unboundIdentifiers.has( node.callee )
		);
	}

	return (
		getMemberPropertyName( node.callee ) === 'getComputedStyle' &&
		node.callee.object?.type === 'Identifier' &&
		[ 'globalThis', 'window' ].includes( node.callee.object.name )
	);
}

function getWpVitestMockName( node ) {
	if ( node.callee?.type !== 'MemberExpression' ) {
		return null;
	}

	const namespace = node.callee.object;
	if (
		namespace?.type !== 'MemberExpression' ||
		getMemberPropertyName( namespace ) !== 'wpVitest' ||
		namespace.object?.type !== 'Identifier' ||
		namespace.object.name !== 'globalThis'
	) {
		return null;
	}

	const mockName = getMemberPropertyName( node.callee );
	return typeof mockName === 'string' && mockName.startsWith( 'mock' )
		? mockName
		: null;
}

function hasTestEnvironmentOverride( source ) {
	return /@(?:jest|vitest)-environment\b/.test( source );
}

function hasBrowserModeImport( source ) {
	return /(?:from\s+|import\s*)[('"](?:@vitest\/browser|vitest\/browser)/.test(
		source
	);
}

function traverseAst( node, visitorKeys, visitors ) {
	if ( ! node?.type ) {
		return;
	}

	visitors[ node.type ]?.( node );

	for ( const key of visitorKeys[ node.type ] ?? [] ) {
		const child = node[ key ];
		if ( Array.isArray( child ) ) {
			child.forEach( ( item ) =>
				traverseAst( item, visitorKeys, visitors )
			);
		} else if ( child?.type ) {
			traverseAst( child, visitorKeys, visitors );
		}
	}
}

function findWorkspacePackage( file ) {
	let directory = path.dirname( path.join( ROOT_DIR, file ) );

	while ( directory.startsWith( ROOT_DIR ) ) {
		const packagePath = path.join( directory, 'package.json' );
		if ( existsSync( packagePath ) ) {
			return packagePath;
		}
		if ( directory === ROOT_DIR ) {
			break;
		}
		directory = path.dirname( directory );
	}

	return null;
}

for ( const file of vitestTests ) {
	const basename = path.basename( file );
	if (
		environmentTokenPattern.test( basename ) &&
		! validEnvironmentSuffixPattern.test( basename )
	) {
		violations.push(
			`${ file }: environment names must use *.jsdom.test.* or *.browser.test.*`
		);
	}
}

for ( const file of [ ...allJsdomTests, ...allBrowserTests ].sort() ) {
	const source = readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
	const project = getVitestProjectName( file );

	violations.push(
		...validateVitestPolicy( {
			file,
			source,
			project,
			allowBrowserFireEvent: Boolean(
				policyExceptions.browserFireEvent[ file ]
			),
			allowJsdomBrowserApis: Boolean(
				policyExceptions.jsdomBrowserApis[ file ]
			),
			allowRenderedUi: renderedUiBaseline.has( file ),
		} )
	);
}

for ( const file of files ) {
	const filename = path.join( ROOT_DIR, file );
	const source = readFileSync( filename, 'utf8' );
	const { ast, scopeManager, visitorKeys } =
		typescriptEslintParser.parseForESLint( source, {
			filePath: filename,
			jsxFragmentName: null,
			jsxPragma: null,
			loc: true,
			range: true,
			sourceType: 'module',
		} );
	const unboundIdentifiers = new Set(
		scopeManager.globalScope?.through.map(
			( reference ) => reference.identifier
		) ?? []
	);
	traverseAst( ast, visitorKeys, {
		AssignmentExpression( node ) {
			if ( isCommonJsExport( node.left ) ) {
				violations.push(
					`${ file }:${ node.loc.start.line } CommonJS export`
				);
			}
		},
		CallExpression( node ) {
			if (
				node.callee?.type === 'Identifier' &&
				node.callee.name === 'require' &&
				unboundIdentifiers.has( node.callee )
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } unbound require()`
				);
			}

			if (
				/\.tsx?$/.test( file ) &&
				node.callee?.type === 'MemberExpression' &&
				node.callee.object?.type === 'Identifier' &&
				node.callee.object.name === 'vi' &&
				node.callee.property?.type === 'Identifier' &&
				node.callee.property.name === 'mock' &&
				! isDynamicImport( node.arguments[ 0 ] )
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } TypeScript vi.mock() must use vi.mock(import(...))`
				);
			}

			if (
				jsdomTests.has( file ) &&
				isGlobalGetComputedStyleCall( node, unboundIdentifiers )
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } computed style assertions require a *.browser.test.* filename`
				);
			}

			if (
				jsdomTests.has( file ) &&
				getMemberPropertyName( node.callee ) === 'toHaveStyle'
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } toHaveStyle() requires a *.browser.test.* filename`
				);
			}

			const wpVitestMockName = getWpVitestMockName( node );
			if ( wpVitestMockName && ! jsdomTests.has( file ) ) {
				violations.push(
					`${ file }:${ node.loc.start.line } wpVitest.${ wpVitestMockName }() requires a *.jsdom.test.* filename`
				);
			}
		},
		ImportDeclaration( node ) {
			if (
				browserTests.has( file ) &&
				node.importKind !== 'type' &&
				node.source.value.startsWith( 'node:' )
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } Browser tests cannot import Node built-ins`
				);
			}
		},
		Identifier( node ) {
			if (
				vitestTests.includes( file ) &&
				vitestApiNames.has( node.name ) &&
				unboundIdentifiers.has( node )
			) {
				violations.push(
					`${ file }:${ node.loc.start.line } unbound Vitest API: ${ node.name }`
				);
			}
		},
	} );

	if (
		vitestTests.includes( file ) &&
		/(?:from\s+|import\s*)[('"]vitest\/globals/.test( source )
	) {
		violations.push( `${ file }: vitest/globals is not allowed` );
	}

	if (
		vitestTests.includes( file ) &&
		hasTestEnvironmentOverride( source )
	) {
		violations.push(
			`${ file }: per-file test environment overrides are not allowed; use the filename suffix`
		);
	}

	if (
		vitestTests.includes( file ) &&
		hasBrowserModeImport( source ) &&
		! browserTests.has( file )
	) {
		violations.push(
			`${ file }: Browser Mode imports require a *.browser.test.* filename`
		);
	}
}

const vitestVersions = new Map();
for ( const file of vitestTests ) {
	const source = readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
	if ( ! /(?:from\s+|import\s*)[('"]vitest[)'"]/.test( source ) ) {
		violations.push( `${ file }: no explicit import from vitest` );
		continue;
	}

	const packagePath = findWorkspacePackage( file );
	if ( ! packagePath ) {
		violations.push( `${ file }: no owning package.json` );
		continue;
	}

	const packageJson = JSON.parse( readFileSync( packagePath, 'utf8' ) );
	const version =
		packageJson.devDependencies?.vitest ?? packageJson.dependencies?.vitest;
	const relativePackagePath = path.relative( ROOT_DIR, packagePath );
	if ( ! version ) {
		violations.push(
			`${ file }: ${ relativePackagePath } must declare Vitest as a direct dependency`
		);
		continue;
	}

	vitestVersions.set( relativePackagePath, version );
}

const distinctVersions = new Set( vitestVersions.values() );
if ( distinctVersions.size > 1 ) {
	violations.push(
		`Vitest dependency versions must match:\n${ [
			...vitestVersions.entries(),
		]
			.map(
				( [ packagePath, version ] ) => `${ packagePath }: ${ version }`
			)
			.join( '\n' ) }`
	);
}

if ( violations.length ) {
	throw new Error(
		`Vitest convention violations:\n${ violations.join( '\n' ) }`
	);
}

const commonTypes = [
	'gutenberg-env',
	'react',
	'react-css-custom-properties',
	'style-imports',
];

function importsNodeBuiltin( file ) {
	const source = readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
	return [
		...source.matchAll( /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g ),
	].some( ( match ) => isBuiltin( match[ 1 ] ) );
}

function getTypecheckConfigPath( testFile ) {
	let directory = path.dirname( path.join( ROOT_DIR, testFile ) );

	while ( directory.startsWith( ROOT_DIR ) && directory !== ROOT_DIR ) {
		for ( const configName of [ 'tsconfig.test.json', 'tsconfig.json' ] ) {
			const configPath = path.join( directory, configName );
			if ( existsSync( configPath ) ) {
				return configPath;
			}
		}
		directory = path.dirname( directory );
	}

	return path.join( ROOT_DIR, 'tsconfig.base.json' );
}

let typescriptTestCount = 0;

for ( const projectName of VITEST_PROJECT_NAMES ) {
	const projectTypescriptTests = vitestTestsByProject[ projectName ].filter(
		( file ) => /\.tsx?$/.test( file )
	);
	if ( ! projectTypescriptTests.length ) {
		continue;
	}

	typescriptTestCount += projectTypescriptTests.length;
	const testsByConfig = new Map();
	for ( const testFile of projectTypescriptTests ) {
		const configPath = getTypecheckConfigPath( testFile );
		const configTests = testsByConfig.get( configPath ) ?? [];
		configTests.push( testFile );
		testsByConfig.set( configPath, configTests );
	}

	for ( const [ baseConfigPath, typeScriptTests ] of testsByConfig ) {
		const needsNodeTypes =
			projectName === 'node' ||
			typeScriptTests.some( importsNodeBuiltin );
		const temporaryDirectory = mkdtempSync(
			path.join(
				os.tmpdir(),
				`gutenberg-vitest-${ projectName }-typecheck-`
			)
		);
		const configPath = path.join( temporaryDirectory, 'tsconfig.json' );
		const compatibilityTypesPath = path.join(
			temporaryDirectory,
			'compatibility.d.ts'
		);
		const setupTypeFiles = [];
		if ( projectName === 'browser' ) {
			setupTypeFiles.push(
				path.join( ROOT_DIR, 'test/unit/config/browser.vitest.js' )
			);
		} else if ( projectName === 'jsdom' ) {
			setupTypeFiles.push(
				path.join(
					ROOT_DIR,
					'test/unit/config/testing-library.vitest.js'
				)
			);
		}
		const typecheckConfig = {
			extends: baseConfigPath,
			compilerOptions: {
				allowJs: true,
				checkJs: false,
				composite: false,
				declaration: true,
				declarationMap: false,
				emitDeclarationOnly: false,
				noEmit: true,
				rootDir: ROOT_DIR,
				typeRoots: [
					path.join( ROOT_DIR, 'typings' ),
					path.join( ROOT_DIR, 'node_modules/@types' ),
				],
				types: [
					...commonTypes,
					...( needsNodeTypes ? [ 'node' ] : [] ),
					'gutenberg-vitest-test-env',
				],
			},
			// Package configs often include every source, story, and test file.
			// This validator owns an exact routed-test set, so do not inherit
			// those broader globs into another Vitest project's typecheck.
			include: [],
			exclude: [],
			files: [
				compatibilityTypesPath,
				...setupTypeFiles,
				...typeScriptTests.map( ( file ) =>
					path.join( ROOT_DIR, file )
				),
			],
		};

		try {
			// Keep narrow compatibility declarations for JavaScript packages
			// without published types and migrated tests that still use Node's
			// `global` alias without injecting all Node globals into browser
			// packages.
			writeFileSync(
				compatibilityTypesPath,
				[
					'declare const global: typeof globalThis;',
					"declare module '@wordpress/commands';",
					"declare module '@wordpress/interface';",
					"declare module 'deep-freeze' { export default function deepFreeze<T>(value: T): T; }",
				].join( '\n' )
			);
			writeFileSync( configPath, JSON.stringify( typecheckConfig ) );
			execFileSync(
				resolvePackageBin( 'typescript' ),
				[ '--project', configPath, '--pretty', 'false' ],
				{ cwd: ROOT_DIR, stdio: 'inherit' }
			);
		} finally {
			rmSync( temporaryDirectory, { force: true, recursive: true } );
		}
	}
}

console.log(
	`Validated ${ vitestTests.length } Vitest tests, ${
		files.length
	} ESM graph files, ${ allJsdomTests.size } jsdom policy files, ${
		allBrowserTests.size
	} Browser policy files, ${
		vitestVersions.size
	} workspace dependencies, and ${ typescriptTestCount } TypeScript ${
		typescriptTestCount === 1 ? 'test' : 'tests'
	}.`
);
