import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createRequire, isBuiltin } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import typescript from 'typescript';
import {
	discoverTestFiles,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';
import { resolvePackageBin } from './resolve-package-bin.mjs';
import { resolveTypeRoots } from './resolve-type-roots.mjs';
import {
	findVitestIsolationOptOuts,
	validateRoutingScripts,
} from './test-infrastructure-policy.mjs';
import {
	validateVitestPolicy,
	validateVitestPolicyExceptions,
} from './vitest-policy-rules.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const require = createRequire( import.meta.url );
const migration = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/test-migration.json' ),
		'utf8'
	)
);
const policyExceptions = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/vitest-policy-exceptions.json' ),
		'utf8'
	)
);
const vitestTestsByProject = getVitestTestsByProject(
	discoverTestFiles( ROOT_DIR ),
	migration
);
const vitestTests = Object.values( vitestTestsByProject ).flat().sort();
const vitestTestSet = new Set( vitestTests );
const jsdomTests = new Set( vitestTestsByProject.jsdom );
const browserTests = new Set( vitestTestsByProject.browser );
const vitestInfrastructure = [
	'test/unit/vitest.config.mjs',
	...globSync( 'test/unit/config/**/*.vitest*.{js,jsx,mjs,ts,tsx}', {
		cwd: ROOT_DIR,
		nodir: true,
	} ),
	...globSync( 'test/unit/scripts/*.mjs', {
		cwd: ROOT_DIR,
		nodir: true,
	} ),
];
const files = [
	...new Set( [ ...vitestTests, ...vitestInfrastructure ] ),
].sort();
const violations = [];
const browserFireEventExceptions =
	policyExceptions?.browserFireEvent ?? Object.create( null );
const jsdomBrowserApiExceptions =
	policyExceptions?.jsdomBrowserApis ?? Object.create( null );
const usedPolicyExceptions = {
	browserFireEvent: new Set(),
	jsdomBrowserApis: new Set(),
};

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

const sourcesByFile = new Map();
for ( const file of files ) {
	const filename = path.join( ROOT_DIR, file );
	const source = readFileSync( filename, 'utf8' );
	sourcesByFile.set( file, source );
	let project = 'node';
	if ( browserTests.has( file ) ) {
		project = 'browser';
	} else if ( jsdomTests.has( file ) ) {
		project = 'jsdom';
	}

	const usedExceptions = new Set();
	violations.push(
		...validateVitestPolicy( {
			file,
			isVitestTest: vitestTestSet.has( file ),
			source,
			project,
			allowBrowserFireEvent: Boolean(
				browserFireEventExceptions[ file ]
			),
			allowJsdomBrowserApis: Boolean( jsdomBrowserApiExceptions[ file ] ),
			usedExceptions,
		} )
	);
	for ( const exceptionName of usedExceptions ) {
		usedPolicyExceptions[ exceptionName ].add( file );
	}
}

violations.push(
	...validateVitestPolicyExceptions( policyExceptions, {
		browserTests,
		jsdomTests,
		usedExceptions: usedPolicyExceptions,
	} )
);

const rootPackageJson = JSON.parse(
	readFileSync( path.join( ROOT_DIR, 'package.json' ), 'utf8' )
);
const unitTestPackageJson = JSON.parse(
	readFileSync( path.join( ROOT_DIR, 'test/unit/package.json' ), 'utf8' )
);
violations.push(
	...findVitestIsolationOptOuts( ROOT_DIR ),
	...validateRoutingScripts( rootPackageJson, unitTestPackageJson )
);

const vitestVersions = new Map();
for ( const file of vitestTests ) {
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
	const source =
		sourcesByFile.get( file ) ??
		readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
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

	const testsByConfig = new Map();
	for ( const testFile of projectTypescriptTests ) {
		const configPath = getTypecheckConfigPath( testFile );
		const configTests = testsByConfig.get( configPath ) ?? [];
		configTests.push( testFile );
		testsByConfig.set( configPath, configTests );
	}

	for ( const [ baseConfigPath, typescriptTests ] of testsByConfig ) {
		const { config: baseConfig, error: baseConfigError } =
			typescript.readConfigFile(
				baseConfigPath,
				typescript.sys.readFile
			);
		if ( baseConfigError ) {
			throw new Error(
				typescript.formatDiagnostics( [ baseConfigError ], {
					getCanonicalFileName: ( fileName ) => fileName,
					getCurrentDirectory: () => ROOT_DIR,
					getNewLine: () => '\n',
				} )
			);
		}

		typescriptTestCount += typescriptTests.length;
		const needsNodeTypes =
			projectName === 'node' ||
			typescriptTests.some( importsNodeBuiltin );
		const temporaryDirectory = mkdtempSync(
			path.join(
				path.dirname( baseConfigPath ),
				`.vitest-${ projectName }-typecheck-`
			)
		);
		const configPath = path.join( temporaryDirectory, 'tsconfig.json' );
		const compatibilityTypesPath = path.join(
			temporaryDirectory,
			'compatibility.d.ts'
		);
		const typecheckConfig = {
			extends: baseConfigPath,
			compilerOptions: {
				allowJs: true,
				allowImportingTsExtensions: true,
				checkJs: false,
				composite: false,
				declaration: true,
				declarationMap: false,
				emitDeclarationOnly: false,
				noEmit: true,
				rootDir: ROOT_DIR,
				typeRoots: [
					path.join( ROOT_DIR, 'typings' ),
					path.join( ROOT_DIR, 'test/unit/typings' ),
					...resolveTypeRoots(
						[ ...commonTypes, 'node' ],
						( specifier ) => require.resolve( specifier )
					),
				],
				types:
					projectName === 'jsdom'
						? [
								...commonTypes,
								...( needsNodeTypes ? [ 'node' ] : [] ),
								'gutenberg-vitest-test-env',
						  ]
						: [
								...commonTypes,
								'node',
								'gutenberg-vitest-test-env',
						  ],
			},
			// Package configs often include every source, story, and test file.
			// This validator owns an exact routed-test set, so do not inherit
			// those broader globs into another Vitest project's typecheck.
			include: [],
			exclude: [],
			references: baseConfig.references?.map( ( reference ) => ( {
				...reference,
				path: path.resolve(
					path.dirname( baseConfigPath ),
					reference.path
				),
			} ) ),
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
				...typescriptTests.map( ( file ) =>
					path.join( ROOT_DIR, file )
				),
			],
		};

		try {
			writeFileSync(
				compatibilityTypesPath,
				[
					'declare const global: typeof globalThis;',
					"declare module '@wordpress/commands';",
					"declare module '@wordpress/interface';",
					"declare module 'deep-freeze' { export default function deepFreeze<T>(value: T): T; }",
				].join( '\n' )
			);
			const typecheckArguments = [
				resolvePackageBin( 'typescript', 'tsc6' ),
				'--project',
				configPath,
				'--pretty',
				'false',
			];
			const runTypecheck = () =>
				spawnSync( process.execPath, typecheckArguments, {
					cwd: ROOT_DIR,
					encoding: 'utf8',
				} );
			writeFileSync( configPath, JSON.stringify( typecheckConfig ) );
			let result = runTypecheck();

			const output = `${ result.stdout ?? '' }${ result.stderr ?? '' }`;
			if ( result.status !== 0 && /TS63(?:05|10)/.test( output ) ) {
				// A dependency cycle can make TypeScript treat routed tests as
				// source files owned by a referenced package project. The package
				// declarations were built before this check, so fall back to normal
				// module resolution when that project-ownership check fails.
				typecheckConfig.references = [];
				writeFileSync( configPath, JSON.stringify( typecheckConfig ) );
				result = runTypecheck();
			}

			if ( result.error ) {
				throw result.error;
			}
			if ( result.status !== 0 ) {
				process.stderr.write( result.stdout ?? '' );
				process.stderr.write( result.stderr ?? '' );
				throw new Error( 'TypeScript test graph validation failed.' );
			}
		} finally {
			rmSync( temporaryDirectory, { force: true, recursive: true } );
		}
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
