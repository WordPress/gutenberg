/**
 * External dependencies
 */
import { parseSync } from '@babel/core';
import traverseModule from '@babel/traverse';
import globPackage from 'glob';

/**
 * Node dependencies
 */
import { execFileSync } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Internal dependencies
 */
import {
	getVitestTests,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';

const traverse = traverseModule.default ?? traverseModule;
const { sync: glob } = globPackage;
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
const vitestTestsByProject = getVitestTestsByProject( ROOT_DIR, migration );
const vitestTests = getVitestTests( ROOT_DIR, migration );
const vitestInfrastructure = [
	'test/unit/vitest.config.mjs',
	...glob( 'test/unit/config/**/*.vitest.{js,mjs,ts,tsx}', {
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
	'it',
	'onTestFailed',
	'onTestFinished',
	'suite',
	'test',
	'vi',
] );
const violations = [];

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

for ( const file of files ) {
	const filename = path.join( ROOT_DIR, file );
	const source = readFileSync( filename, 'utf8' );
	const plugins = [
		'decorators-legacy',
		'importAttributes',
		'jsx',
		'topLevelAwait',
	];

	if ( /\.[cm]?tsx?$/.test( file ) ) {
		plugins.push( 'typescript' );
	}

	const ast = parseSync( source, {
		ast: true,
		babelrc: false,
		code: false,
		configFile: false,
		filename,
		parserOpts: {
			plugins,
			sourceType: 'module',
		},
	} );

	traverse( ast, {
		AssignmentExpression( astPath ) {
			if ( isCommonJsExport( astPath.node.left ) ) {
				violations.push(
					`${ file }:${ astPath.node.loc.start.line } CommonJS export`
				);
			}
		},
		CallExpression( astPath ) {
			const { node } = astPath;

			if (
				node.callee?.type === 'Identifier' &&
				node.callee.name === 'require' &&
				! astPath.scope.hasBinding( 'require' )
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
		},
		ReferencedIdentifier( astPath ) {
			const { name } = astPath.node;
			if (
				vitestTests.includes( file ) &&
				vitestApiNames.has( name ) &&
				! astPath.scope.hasBinding( name )
			) {
				violations.push(
					`${ file }:${ astPath.node.loc.start.line } unbound Vitest API: ${ name }`
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
	const version = packageJson.devDependencies?.vitest;
	const relativePackagePath = path.relative( ROOT_DIR, packagePath );
	if ( ! version ) {
		violations.push(
			`${ file }: ${ relativePackagePath } must declare devDependencies.vitest`
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

const typescriptTestsByProject = Object.fromEntries(
	VITEST_PROJECT_NAMES.map( ( projectName ) => [
		projectName,
		vitestTestsByProject[ projectName ].filter( ( file ) =>
			/\.tsx?$/.test( file )
		),
	] )
);
const typescriptTests = Object.values( typescriptTestsByProject ).flat();
const commonTypes = [
	'gutenberg-env',
	'node',
	'react-css-custom-properties',
	'style-imports',
];

for ( const projectName of VITEST_PROJECT_NAMES ) {
	const projectTypescriptTests = typescriptTestsByProject[ projectName ];
	if ( ! projectTypescriptTests.length ) {
		continue;
	}

	const temporaryDirectory = mkdtempSync(
		path.join( os.tmpdir(), `gutenberg-vitest-${ projectName }-typecheck-` )
	);
	const configPath = path.join( temporaryDirectory, 'tsconfig.json' );
	const compatibilityTypesPath = path.join(
		temporaryDirectory,
		'compatibility.d.ts'
	);
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
			types:
				projectName === 'jsdom'
					? [ ...commonTypes, 'gutenberg-vitest-test-env' ]
					: commonTypes,
		},
		files: [
			compatibilityTypesPath,
			...( projectName === 'jsdom'
				? [
						path.join(
							ROOT_DIR,
							'test/unit/config/testing-library.vitest.js'
						),
				  ]
				: [] ),
			...projectTypescriptTests.map( ( file ) =>
				path.join( ROOT_DIR, file )
			),
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
			path.join(
				ROOT_DIR,
				'node_modules/.bin',
				process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
			),
			[ '--project', configPath, '--pretty', 'false' ],
			{ cwd: ROOT_DIR, stdio: 'inherit' }
		);
	} finally {
		rmSync( temporaryDirectory, { force: true, recursive: true } );
	}
}

console.log(
	`Validated ${ vitestTests.length } Vitest tests, ${ files.length } ESM graph files, ${ vitestVersions.size } workspace dependencies, and ${ typescriptTests.length } TypeScript tests.`
);
