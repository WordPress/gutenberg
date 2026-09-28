import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import {
	discoverTestFiles,
	findOverlappingVitestProjectTests,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';
import { resolvePackageBin } from './resolve-package-bin.mjs';
import { collectJestInfrastructureEntries } from './test-infrastructure-policy.mjs';
import { sourceHasTestEnvironmentOverride } from './test-environment-overrides.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const VITEST_CONFIG = 'test/unit/vitest.config.mjs';

function readInfrastructureSource( file ) {
	try {
		return readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return null;
		}
		throw error;
	}
}

function normalizeTestPath( testPath ) {
	return path
		.relative( ROOT_DIR, path.resolve( ROOT_DIR, testPath ) )
		.split( path.sep )
		.join( '/' );
}

function runTestList( packageName, args ) {
	const result = spawnSync(
		process.execPath,
		[ resolvePackageBin( packageName ), ...args ],
		{
			cwd: ROOT_DIR,
			encoding: 'utf8',
			env: process.env,
			maxBuffer: 20 * 1024 * 1024,
		}
	);

	if ( result.error ) {
		throw result.error;
	}

	if ( result.status !== 0 ) {
		process.stderr.write( result.stdout ?? '' );
		process.stderr.write( result.stderr ?? '' );
		process.exit( result.status ?? 1 );
	}

	return result.stdout.trim().split( /\r?\n/ ).filter( Boolean );
}

function listVitestTestsByProject() {
	const testsByProject = Object.fromEntries(
		VITEST_PROJECT_NAMES.map( ( projectName ) => [
			projectName,
			new Set(),
		] )
	);
	const lines = runTestList( 'vitest', [
		'list',
		'--config',
		VITEST_CONFIG,
		'--filesOnly',
		'--passWithNoTests',
	] );

	for ( const line of lines ) {
		const match = line.match( /^\[([^\]]+)\]\s+(.+)$/ );
		assert.ok( match, `Unexpected Vitest list output: ${ line }` );
		const [ , listedProjectName, testPath ] = match;
		const projectName = listedProjectName.replace( / \(.+\)$/, '' );
		assert.ok(
			testsByProject[ projectName ],
			`Unexpected Vitest project \`${ projectName }\`. Expected only: ${ VITEST_PROJECT_NAMES.join(
				', '
			) }`
		);
		assert.ok(
			existsSync( path.resolve( ROOT_DIR, testPath ) ),
			`Vitest ${ projectName } listed a missing test: ${ testPath }`
		);
		const normalizedPath = normalizeTestPath( testPath );
		assert.ok(
			! testsByProject[ projectName ].has( normalizedPath ),
			`Vitest ${ projectName } listed a test twice: ${ normalizedPath }`
		);
		testsByProject[ projectName ].add( normalizedPath );
	}

	return testsByProject;
}

const staticInventory = discoverTestFiles( ROOT_DIR );
const testsWithEnvironmentOverrides = staticInventory.filter( ( testPath ) =>
	sourceHasTestEnvironmentOverride(
		readFileSync( path.join( ROOT_DIR, testPath ), 'utf8' ),
		testPath
	)
);
assert.deepEqual(
	testsWithEnvironmentOverrides,
	[],
	`Per-file test environment overrides are not allowed; use the filename suffix:\n${ testsWithEnvironmentOverrides.join(
		'\n'
	) }`
);
const expectedVitestTestsByProject = getVitestTestsByProject( staticInventory );
const vitestTestsByProject = listVitestTestsByProject();
const overlappingVitestProjectTests =
	findOverlappingVitestProjectTests( vitestTestsByProject );
assert.deepEqual(
	overlappingVitestProjectTests,
	[],
	`Tests are owned by multiple Vitest projects:\n${ overlappingVitestProjectTests.join(
		'\n'
	) }`
);

for ( const projectName of VITEST_PROJECT_NAMES ) {
	assert.deepEqual(
		[ ...vitestTestsByProject[ projectName ] ].sort(),
		expectedVitestTestsByProject[ projectName ],
		`Vitest ${ projectName } project discovery does not match filename-based ownership.`
	);
}

const vitestTests = new Set(
	Object.values( vitestTestsByProject ).flatMap( ( projectTests ) => [
		...projectTests,
	] )
);

// Retain only the public Jest adapter, legacy E2E/reporting packages, and the
// runner-neutral jest-dom rules and Jest lint rules for legacy consumers.
const retainedJestInfrastructure = [
	'dependency:packages/eslint-plugin/package.json:dependencies.eslint-plugin-jest',
	'dependency:packages/report-flaky-tests/package.json:dependencies.@jest/test-result',
	'dependency:packages/report-flaky-tests/package.json:dependencies.jest-message-util',
	'dependency:packages/scripts/package.json:peerDependencies.jest',
	'dependency:tools/eslint/package.json:dependencies.eslint-plugin-jest-dom',
];
const infrastructureFiles = globSync(
	[
		'**/package.json',
		'**/*jest*.config.*',
		'.github/{actions,workflows}/**/*.{yml,yaml}',
	],
	{
		cwd: ROOT_DIR,
		dot: true,
		nodir: true,
		ignore: [
			'**/node_modules/**',
			'**/build/**',
			'**/build-module/**',
			'**/build-style/**',
			'**/build-types/**',
			'**/build-wp/**',
			'vendor/**',
			'**/.git/**',
		],
	}
);
const jestInfrastructure = collectJestInfrastructureEntries(
	infrastructureFiles,
	readInfrastructureSource
);
assert.deepEqual(
	jestInfrastructure,
	retainedJestInfrastructure,
	'Jest infrastructure must exactly match the retained public tooling and active lint rules.'
);
assert.deepEqual(
	[ ...vitestTests ].sort(),
	staticInventory,
	'Executable Vitest inventory does not match static test discovery.'
);

console.log(
	`Validated exactly one Vitest project for each of ${ staticInventory.length } tests.`
);
