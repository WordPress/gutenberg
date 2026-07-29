/**
 * Node dependencies
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/**
 * External dependencies
 */
import globPackage from 'glob';

/**
 * Internal dependencies
 */
import {
	discoverTestFiles,
	getVitestTests,
	hashTestFiles,
} from './discover-test-files.mjs';

const require = createRequire( import.meta.url );
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const JEST_CONFIG = 'test/unit/jest.config.js';
const VITEST_CONFIG = 'test/unit/vitest.config.mjs';
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

function resolvePackageBin( packageName ) {
	const packageJsonPath = require.resolve( `${ packageName }/package.json` );
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	const binPath =
		typeof packageJson.bin === 'string'
			? packageJson.bin
			: packageJson.bin[ packageName ];

	return path.resolve( path.dirname( packageJsonPath ), binPath );
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

	if ( result.status !== 0 ) {
		process.stderr.write( result.stdout );
		process.stderr.write( result.stderr );
		process.exit( result.status ?? 1 );
	}

	return new Set(
		result.stdout
			.trim()
			.split( /\r?\n/ )
			.filter( Boolean )
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

const jestTests = listTests( 'jest', [
	'--config',
	JEST_CONFIG,
	'--listTests',
] );
const vitestTests = existsSync( path.join( ROOT_DIR, VITEST_CONFIG ) )
	? listTests( 'vitest', [
			'list',
			'--config',
			VITEST_CONFIG,
			'--filesOnly',
	  ] )
	: new Set();

const addedJestTests = manifest.added.jest;
const addedVitestTests = manifest.added.vitest;
const addedTests = [ ...addedJestTests, ...addedVitestTests ];
const retiredTests = manifest.retired;
const migratedTestFiles = manifest.vitest.files;
const migratedDirectories = manifest.vitest.directories;

assertUniquePaths( 'added.jest', addedJestTests );
assertUniquePaths( 'added.vitest', addedVitestTests );
assertUniquePaths( 'retired', retiredTests );
assertUniquePaths( 'vitest.files', migratedTestFiles );
assertUniquePaths( 'vitest.directories', migratedDirectories );

const duplicateManifestEntries = addedTests.filter(
	( testPath, index ) =>
		addedTests.indexOf( testPath ) !== index ||
		retiredTests.includes( testPath )
);
assert.deepEqual(
	duplicateManifestEntries,
	[],
	`Migration manifest entries must be disjoint:\n${ duplicateManifestEntries.join(
		'\n'
	) }`
);

const invalidMigratedEntries = [
	...migratedTestFiles.filter(
		( testPath ) => ! existsSync( path.join( ROOT_DIR, testPath ) )
	),
	...migratedDirectories.filter(
		( directoryPath ) =>
			! existsSync( path.join( ROOT_DIR, directoryPath ) )
	),
];
assert.deepEqual(
	invalidMigratedEntries,
	[],
	`Migrated files or directories do not exist:\n${ invalidMigratedEntries.join(
		'\n'
	) }`
);

const invalidAddedTests = addedTests.filter(
	( testPath ) => ! existsSync( path.join( ROOT_DIR, testPath ) )
);
assert.deepEqual(
	invalidAddedTests,
	[],
	`Added tests do not exist:\n${ invalidAddedTests.join( '\n' ) }`
);

const activeRetiredTests = retiredTests.filter(
	( testPath ) =>
		existsSync( path.join( ROOT_DIR, testPath ) ) ||
		jestTests.has( testPath ) ||
		vitestTests.has( testPath )
);
assert.deepEqual(
	activeRetiredTests,
	[],
	`Retired tests still exist or are discoverable:\n${ activeRetiredTests.join(
		'\n'
	) }`
);

const missingAddedJestTests = addedJestTests.filter(
	( testPath ) => ! jestTests.has( testPath )
);
const missingAddedVitestTests = addedVitestTests.filter(
	( testPath ) => ! vitestTests.has( testPath )
);
assert.deepEqual(
	missingAddedJestTests,
	[],
	`Added Jest tests are not discoverable by Jest:\n${ missingAddedJestTests.join(
		'\n'
	) }`
);
assert.deepEqual(
	missingAddedVitestTests,
	[],
	`Added Vitest tests are not discoverable by Vitest:\n${ missingAddedVitestTests.join(
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

const expectedVitestTests = getVitestTests( ROOT_DIR, manifest );
assert.deepEqual(
	[ ...vitestTests ].sort(),
	expectedVitestTests,
	`Vitest discovery does not match the migration manifest.`
);

const accountedBaseline = [
	...new Set( [
		...[ ...jestTests ].filter(
			( testPath ) => ! addedJestTests.includes( testPath )
		),
		...[ ...vitestTests ].filter(
			( testPath ) => ! addedVitestTests.includes( testPath )
		),
		...retiredTests,
	] ),
].sort();

assert.equal(
	accountedBaseline.length,
	manifest.baseline.count,
	'The number of accounted baseline tests changed.'
);
assert.equal(
	hashTestFiles( accountedBaseline ),
	manifest.baseline.sha256,
	'The accounted baseline test file list changed.'
);

const staticInventory = discoverTestFiles( ROOT_DIR );
const expectedStaticInventory = [ ...accountedBaseline, ...addedTests ]
	.filter( ( testPath ) => ! retiredTests.includes( testPath ) )
	.sort();
assert.deepEqual(
	staticInventory,
	expectedStaticInventory,
	'Static test discovery does not match the executable runner inventory.'
);

const { sync: glob } = globPackage;
const orphanedSnapshots = glob( '**/__snapshots__/*.snap', {
	cwd: ROOT_DIR,
	ignore: [ '**/node_modules/**', '**/vendor/**' ],
	nodir: true,
} ).filter( ( snapshotPath ) => {
	const testPath = path.join(
		path.dirname( path.dirname( snapshotPath ) ),
		path.basename( snapshotPath, '.snap' )
	);
	return ! existsSync( path.join( ROOT_DIR, testPath ) );
} );
assert.deepEqual(
	orphanedSnapshots,
	[],
	`Snapshots without a matching test file:\n${ orphanedSnapshots.join(
		'\n'
	) }`
);

console.log(
	`Validated exactly one runner for ${ manifest.baseline.count } baseline tests: ${ jestTests.size } Jest, ${ vitestTests.size } Vitest, ${ retiredTests.length } retired, and ${ addedTests.length } added.`
);
