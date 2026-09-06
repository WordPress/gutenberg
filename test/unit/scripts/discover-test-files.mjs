import path from 'node:path';
import { globSync } from 'glob';

export const TEST_PATTERNS = [
	'**/__tests__/**/*.[jt]s?(x)',
	'**/test/*.[jt]s?(x)',
	'**/?(*.)test.[jt]s?(x)',
];

export const TEST_IGNORES = [
	'**/.git/**',
	'**/node_modules/**',
	'packages/e2e-tests/**',
	'packages/e2e-test-utils-playwright/src/test.ts',
	'**/build/**',
	'**/build-module/**',
	'**/build-types/**',
	'**/*.d.ts',
	'vendor/**',
];

export const VITEST_PROJECT_NAMES = [ 'node', 'jsdom', 'browser' ];

const JSDOM_TEST_PATH_PATTERN = /\.jsdom\.test\.[jt]sx?$/;
const BROWSER_TEST_PATH_PATTERN = /\.browser\.test\.[jt]sx?$/;

function normalizeTestPath( testPath ) {
	return testPath.split( path.sep ).join( '/' );
}

export function discoverTestFiles( rootDir ) {
	return [
		...new Set(
			TEST_PATTERNS.flatMap( ( pattern ) =>
				globSync( pattern, {
					absolute: false,
					cwd: rootDir,
					dot: true,
					ignore: TEST_IGNORES,
					nodir: true,
				} )
			).map( normalizeTestPath )
		),
	].sort();
}

export function getVitestTests( discoveredTests, manifest ) {
	const jestTests = new Set( manifest.jest.files );

	return discoveredTests
		.filter( ( testPath ) => ! jestTests.has( testPath ) )
		.sort();
}

export function findAddedLegacyJestTests( currentTests, baselineTests ) {
	const baselineTestSet = new Set( baselineTests );

	return currentTests
		.filter( ( testPath ) => ! baselineTestSet.has( testPath ) )
		.sort();
}

export function getTestEnvironmentName( testPath ) {
	if ( BROWSER_TEST_PATH_PATTERN.test( testPath ) ) {
		return 'browser';
	}

	if ( JSDOM_TEST_PATH_PATTERN.test( testPath ) ) {
		return 'jsdom';
	}

	return 'node';
}

export function getVitestTestsByProject( discoveredTests, manifest ) {
	const testsByProject = Object.fromEntries(
		VITEST_PROJECT_NAMES.map( ( projectName ) => [ projectName, [] ] )
	);

	for ( const testPath of getVitestTests( discoveredTests, manifest ) ) {
		testsByProject[ getTestEnvironmentName( testPath ) ].push( testPath );
	}

	return testsByProject;
}

export function findOverlappingVitestProjectTests( testsByProject ) {
	const projectOwners = new Map();

	for ( const [ projectName, projectTests ] of Object.entries(
		testsByProject
	) ) {
		for ( const testPath of projectTests ) {
			const owners = projectOwners.get( testPath ) ?? [];
			owners.push( projectName );
			projectOwners.set( testPath, owners );
		}
	}

	return [ ...projectOwners ]
		.filter( ( [ , owners ] ) => owners.length > 1 )
		.map(
			( [ testPath, owners ] ) =>
				`${ testPath }: ${ owners.join( ', ' ) }`
		);
}
