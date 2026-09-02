import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	discoverTestFiles,
	findOverlappingVitestProjectTests,
	getTestEnvironmentName,
	getVitestTests,
	getVitestTestsByProject,
	VITEST_PROJECT_NAMES,
} from './discover-test-files.mjs';
import { resolvePackageBin } from './resolve-package-bin.mjs';
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

	return new Set(
		result.stdout
			.trim()
			.split( /\r?\n/ )
			.filter( Boolean )
			.map( ( testPath ) => testPath.replace( /^\[[^\]]+\]\s+/, '' ) )
			.filter( ( testPath ) =>
				existsSync( path.resolve( ROOT_DIR, testPath ) )
			)
			.map( normalizeTestPath )
	);
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

function isWithinDirectory( testPath, directoryPath ) {
	return (
		testPath === directoryPath ||
		testPath.startsWith( `${ directoryPath }/` )
	);
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
const expectedVitestTestSet = new Set( expectedVitestTests );
const expectedJestTestsByProject = {
	jsdom: staticInventory.filter(
		( testPath ) =>
			! expectedVitestTestSet.has( testPath ) &&
			getTestEnvironmentName( testPath ) === 'jsdom'
	),
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
const vitestTestsByProject = Object.fromEntries(
	VITEST_PROJECT_NAMES.map( ( projectName ) => [
		projectName,
		existsSync( path.join( ROOT_DIR, VITEST_CONFIG ) )
			? listTests( 'vitest', [
					'list',
					'--config',
					VITEST_CONFIG,
					'--project',
					projectName,
					'--filesOnly',
					'--passWithNoTests',
			  ] )
			: new Set(),
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

const migratedTestFiles = manifest.vitest.files;
const migratedDirectories = manifest.vitest.directories;

assertUniquePaths( 'vitest.files', migratedTestFiles );
assertUniquePaths( 'vitest.directories', migratedDirectories );

const overlappingManifestEntries = [
	...migratedTestFiles.filter( ( testPath ) =>
		migratedDirectories.some( ( directoryPath ) =>
			isWithinDirectory( testPath, directoryPath )
		)
	),
	...migratedDirectories.filter( ( directoryPath, index ) =>
		migratedDirectories.some(
			( otherDirectoryPath, otherIndex ) =>
				otherIndex !== index &&
				isWithinDirectory( directoryPath, otherDirectoryPath )
		)
	),
];
assert.deepEqual(
	overlappingManifestEntries,
	[],
	`Vitest migration manifest entries must be disjoint:\n${ overlappingManifestEntries.join(
		'\n'
	) }`
);

const invalidMigratedEntries = [
	...migratedTestFiles.filter(
		( testPath ) => ! isValidManifestPath( testPath, 'isFile' )
	),
	...migratedDirectories.filter(
		( directoryPath ) =>
			! isValidManifestPath( directoryPath, 'isDirectory' )
	),
];
assert.deepEqual(
	invalidMigratedEntries,
	[],
	`Migrated files or directories must exist inside the repository and match their declared type:\n${ invalidMigratedEntries.join(
		'\n'
	) }`
);

const emptyMigratedDirectories = migratedDirectories.filter(
	( directoryPath ) =>
		! staticInventory.some( ( testPath ) =>
			isWithinDirectory( testPath, directoryPath )
		)
);
assert.deepEqual(
	emptyMigratedDirectories,
	[],
	`Migrated directories must contain at least one test:\n${ emptyMigratedDirectories.join(
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
	`Vitest discovery does not match the migration manifest.`
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
