import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import {
	discoverTestFiles,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';
import { resolvePackageBin } from './resolve-package-bin.mjs';
import {
	validateVitestPolicy,
	validateVitestPolicyExceptions,
} from './vitest-policy-rules.mjs';

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
	const configPath = path.join(
		ROOT_DIR,
		'test/unit',
		`.vitest-${ projectName }-typecheck.json`
	);
	const needsNodeTypes =
		projectName === 'node' ||
		typescriptTests.some( ( file ) =>
			/[('"]node:/.test( sourcesByFile.get( file ) )
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
			checkJs: false,
			composite: false,
			emitDeclarationOnly: false,
			noEmit: true,
			rootDir: ROOT_DIR,
			types: [ ...commonTypes, ...( needsNodeTypes ? [ 'node' ] : [] ) ],
		},
		files: [
			...setupTypeFiles,
			...typescriptTests.map( ( file ) => path.join( ROOT_DIR, file ) ),
		],
	};

	try {
		writeFileSync( configPath, JSON.stringify( typecheckConfig ) );
		execFileSync(
			process.execPath,
			[
				resolvePackageBin( 'typescript', 'tsc6' ),
				'--project',
				configPath,
				'--pretty',
				'false',
			],
			{ cwd: ROOT_DIR, stdio: 'inherit' }
		);
	} finally {
		rmSync( configPath, { force: true } );
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
