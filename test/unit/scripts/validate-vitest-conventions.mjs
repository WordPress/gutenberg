import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import typescriptEslintParser from '@typescript-eslint/parser';
import globPackage from 'glob';
import {
	discoverTestFiles,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';

const { sync: glob } = globPackage;
const require = createRequire( import.meta.url );
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const migration = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/test-migration.json' ),
		'utf8'
	)
);
const vitestTestsByProject = getVitestTestsByProject(
	discoverTestFiles( ROOT_DIR ),
	migration
);
const vitestTests = Object.values( vitestTestsByProject ).flat().sort();
const jsdomTests = new Set( vitestTestsByProject.jsdom );
const browserTests = new Set( vitestTestsByProject.browser );
const vitestInfrastructure = [
	'test/unit/vitest.config.mjs',
	...glob( 'test/unit/config/**/*.vitest*.{js,mjs,ts,tsx}', {
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
	'react-css-custom-properties',
	'style-imports',
];
let typescriptTestCount = 0;

for ( const projectName of VITEST_PROJECT_NAMES ) {
	const typescriptTests = vitestTestsByProject[ projectName ].filter(
		( file ) => /\.tsx?$/.test( file )
	);
	if ( ! typescriptTests.length ) {
		continue;
	}

	typescriptTestCount += typescriptTests.length;
	const temporaryDirectory = mkdtempSync(
		path.join( os.tmpdir(), `gutenberg-vitest-${ projectName }-typecheck-` )
	);
	const configPath = path.join( temporaryDirectory, 'tsconfig.json' );
	const compatibilityTypesPath = path.join(
		temporaryDirectory,
		'compatibility.d.ts'
	);
	const needsNodeTypes =
		projectName === 'node' ||
		typescriptTests.some( ( file ) =>
			/[('"]node:/.test(
				readFileSync( path.join( ROOT_DIR, file ), 'utf8' )
			)
		);
	const setupTypeFiles =
		projectName === 'jsdom'
			? [
					path.join(
						ROOT_DIR,
						'test/unit/config/testing-library.vitest.js'
					),
			  ]
			: [];
	const typecheckConfig = {
		extends: path.join( ROOT_DIR, 'tsconfig.base.json' ),
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
			types: [ ...commonTypes, ...( needsNodeTypes ? [ 'node' ] : [] ) ],
		},
		files: [
			compatibilityTypesPath,
			...setupTypeFiles,
			...typescriptTests.map( ( file ) => path.join( ROOT_DIR, file ) ),
		],
	};

	try {
		// @wordpress/commands is a JavaScript package without published types.
		// Keep this exception explicit until that package gains declarations.
		writeFileSync(
			compatibilityTypesPath,
			"declare module '@wordpress/commands';"
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

console.log(
	`Validated ${ vitestTests.length } Vitest tests, ${
		files.length
	} ESM graph files, ${
		vitestVersions.size
	} workspace dependencies, and ${ typescriptTestCount } TypeScript ${
		typescriptTestCount === 1 ? 'test' : 'tests'
	}.`
);
