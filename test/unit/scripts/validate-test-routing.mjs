import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	discoverTestFiles,
	findAddedLegacyJestTests,
	findOverlappingVitestProjectTests,
	getTestEnvironmentName,
	getVitestTests,
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
const JEST_CONFIG = 'test/unit/jest.config.js';
const VITEST_CONFIG = 'test/unit/vitest.config.mjs';
const require = createRequire( import.meta.url );
const manifest = JSON.parse(
	readFileSync(
		path.join( ROOT_DIR, 'test/unit/test-migration.json' ),
		'utf8'
	)
);

function normalizeTestPath( testPath ) {
	return path
		.relative( ROOT_DIR, path.resolve( ROOT_DIR, testPath ) )
		.split( path.sep )
		.join( '/' );
}

function listTests( packageName, args ) {
	const lines = runTestList( packageName, args );

	return new Set(
		lines
			.map( ( testPath ) => testPath.replace( /^\[[^\]]+\]\s+/, '' ) )
			.filter( ( testPath ) =>
				existsSync( path.resolve( ROOT_DIR, testPath ) )
			)
			.map( normalizeTestPath )
	);
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
		const [ , projectName, testPath ] = match;
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
		testsByProject[ projectName ].add( normalizeTestPath( testPath ) );
	}

	return testsByProject;
}

function assertUniquePaths( label, testPaths ) {
	assert.equal(
		new Set( testPaths ).size,
		testPaths.length,
		`${ label } contains duplicate paths.`
	);

	for ( const testPath of testPaths ) {
		assert.equal(
			testPath,
			normalizeTestPath( testPath ),
			`${ label } contains a non-normalized path: ${ testPath }`
		);
	}
}

function isValidManifestPath( testPath, expectedType ) {
	const resolvedPath = path.resolve( ROOT_DIR, testPath );
	const relativePath = path.relative( ROOT_DIR, resolvedPath );
	const isWithinRoot =
		relativePath !== '..' &&
		! relativePath.startsWith( `..${ path.sep }` ) &&
		! path.isAbsolute( relativePath );

	return (
		isWithinRoot &&
		existsSync( resolvedPath ) &&
		statSync( resolvedPath )[ expectedType ]()
	);
}

function getCommandArgument( name ) {
	const inlinePrefix = `--${ name }=`;
	const inlineArgument = process.argv.find( ( argument ) =>
		argument.startsWith( inlinePrefix )
	);
	if ( inlineArgument ) {
		return inlineArgument.slice( inlinePrefix.length );
	}

	const argumentIndex = process.argv.indexOf( `--${ name }` );
	return argumentIndex === -1 ? null : process.argv[ argumentIndex + 1 ];
}

function runGit( args ) {
	return spawnSync( 'git', args, {
		cwd: ROOT_DIR,
		encoding: 'utf8',
	} );
}

function getBaselineRef() {
	const explicitBase = getCommandArgument( 'base' );
	if ( explicitBase ) {
		return explicitBase;
	}
	assert.notEqual(
		process.env.GITHUB_ACTIONS,
		'true',
		'CI must pass an explicit --base=<commit> to validate that the legacy Jest allowlist did not grow.'
	);

	const mergeBase = runGit( [ 'merge-base', 'HEAD', 'origin/trunk' ] );
	return mergeBase.status === 0 ? mergeBase.stdout.trim() : 'HEAD';
}

function readBaselineMigrationManifest( baselineRef ) {
	const result = runGit( [
		'show',
		`${ baselineRef }:test/unit/test-migration.json`,
	] );

	if ( result.status !== 0 ) {
		assert.notEqual(
			process.env.GITHUB_ACTIONS,
			'true',
			`CI must fetch the baseline commit ${ baselineRef } to validate that the legacy Jest allowlist did not grow.`
		);
		return null;
	}

	return JSON.parse( result.stdout );
}

function getChangedFiles( baselineRef ) {
	const result = runGit( [
		'diff',
		'--name-only',
		'--diff-filter=ACMR',
		baselineRef,
		'--',
	] );
	assert.equal(
		result.status,
		0,
		'Could not compare Jest infrastructure with ' +
			baselineRef +
			':\n' +
			result.stderr
	);

	return result.stdout.trim().split( /\r?\n/ ).filter( Boolean );
}

function readBaselineFile( baselineRef, file ) {
	const result = runGit( [ 'show', `${ baselineRef }:${ file }` ] );
	return result.status === 0 ? result.stdout : null;
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
const expectedVitestTestsByProject = getVitestTestsByProject(
	staticInventory,
	manifest
);
const expectedVitestTests = getVitestTests( staticInventory, manifest );
const expectedJestTestsByProject = {
	jsdom: [ ...manifest.jest.files ].sort(),
};
const jestConfig = require( path.join( ROOT_DIR, JEST_CONFIG ) );
const jestProjectNames = jestConfig.projects.map( ( project ) =>
	typeof project.displayName === 'string'
		? project.displayName
		: project.displayName?.name
);
assert.deepEqual(
	jestProjectNames.sort(),
	Object.keys( expectedJestTestsByProject ).sort(),
	'Jest must only define projects for tests that have not migrated to Vitest.'
);
const jestTestsByProject = Object.fromEntries(
	Object.keys( expectedJestTestsByProject ).map( ( projectName ) => [
		projectName,
		listTests( 'jest', [
			'--config',
			JEST_CONFIG,
			'--selectProjects',
			projectName,
			'--listTests',
		] ),
	] )
);
for ( const [ projectName, projectTests ] of Object.entries(
	jestTestsByProject
) ) {
	assert.deepEqual(
		[ ...projectTests ].sort(),
		expectedJestTestsByProject[ projectName ],
		`Jest ${ projectName } project discovery does not match filename-based ownership.`
	);
}
const jestTests = new Set(
	Object.values( jestTestsByProject ).flatMap( ( projectTests ) => [
		...projectTests,
	] )
);
const vitestTestsByProject = existsSync( path.join( ROOT_DIR, VITEST_CONFIG ) )
	? listVitestTestsByProject()
	: Object.fromEntries(
			VITEST_PROJECT_NAMES.map( ( projectName ) => [
				projectName,
				new Set(),
			] )
	  );
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

const legacyJestTestFiles = manifest.jest.files;
const baselineRef = getBaselineRef();
const baselineMigrationManifest = readBaselineMigrationManifest( baselineRef );

assertUniquePaths( 'jest.files', legacyJestTestFiles );

if ( baselineMigrationManifest?.jest?.files ) {
	const addedLegacyJestTests = findAddedLegacyJestTests(
		legacyJestTestFiles,
		baselineMigrationManifest.jest.files
	);
	assert.deepEqual(
		addedLegacyJestTests,
		[],
		`jest.files is shrink-only. New tests must run in Vitest:\n${ addedLegacyJestTests.join(
			'\n'
		) }`
	);
}

const changedFiles = getChangedFiles( baselineRef );
const currentJestInfrastructure = collectJestInfrastructureEntries(
	changedFiles,
	( file ) => {
		const filename = path.join( ROOT_DIR, file );
		return existsSync( filename ) ? readFileSync( filename, 'utf8' ) : null;
	}
);
const baselineJestInfrastructure = new Set(
	collectJestInfrastructureEntries( changedFiles, ( file ) =>
		readBaselineFile( baselineRef, file )
	)
);
const addedJestInfrastructure = currentJestInfrastructure.filter(
	( entry ) => ! baselineJestInfrastructure.has( entry )
);
assert.deepEqual(
	addedJestInfrastructure,
	[],
	`New Jest-only configuration, dependencies, and commands are not allowed:\n${ addedJestInfrastructure.join(
		'\n'
	) }`
);

const invalidLegacyJestEntries = legacyJestTestFiles.filter(
	( testPath ) =>
		! isValidManifestPath( testPath, 'isFile' ) ||
		! staticInventory.includes( testPath ) ||
		getTestEnvironmentName( testPath ) !== 'jsdom'
);
assert.deepEqual(
	invalidLegacyJestEntries,
	[],
	`Legacy Jest entries must be discovered JSDOM test files inside the repository:\n${ invalidLegacyJestEntries.join(
		'\n'
	) }`
);

const overlappingTests = [ ...jestTests ].filter( ( testPath ) =>
	vitestTests.has( testPath )
);
assert.deepEqual(
	overlappingTests,
	[],
	`Tests are owned by both Jest and Vitest:\n${ overlappingTests.join(
		'\n'
	) }`
);

assert.deepEqual(
	[ ...vitestTests ].sort(),
	expectedVitestTests,
	`Vitest discovery does not match the legacy Jest allowlist.`
);

const runnerInventory = [
	...new Set( [ ...jestTests, ...vitestTests ] ),
].sort();
assert.deepEqual(
	runnerInventory,
	staticInventory,
	'Executable runner inventory does not match static test discovery.'
);

console.log(
	`Validated exactly one runner for ${ staticInventory.length } tests: ${ jestTests.size } Jest and ${ vitestTests.size } Vitest.`
);
