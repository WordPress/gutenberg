import path from 'node:path';
import globPackage from 'glob';

const { sync: glob } = globPackage;

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

const JSDOM_TEST_PATH_PATTERN = /\.jsdom\.test\.[cm]?[jt]sx?$/;
const BROWSER_TEST_PATH_PATTERN = /\.browser\.test\.[cm]?[jt]sx?$/;

function normalizeTestPath( testPath ) {
	return testPath.split( path.sep ).join( '/' );
}

export function discoverTestFiles( rootDir ) {
	return [
		...new Set(
			TEST_PATTERNS.flatMap( ( pattern ) =>
				glob( pattern, {
					absolute: false,
					cwd: rootDir,
					ignore: TEST_IGNORES,
					nodir: true,
				} )
			).map( normalizeTestPath )
		),
	].sort();
}

export function getVitestProjectName( testPath ) {
	const normalizedTestPath = normalizeTestPath( testPath );

	if ( BROWSER_TEST_PATH_PATTERN.test( normalizedTestPath ) ) {
		return 'browser';
	}

	if ( JSDOM_TEST_PATH_PATTERN.test( normalizedTestPath ) ) {
		return 'jsdom';
	}

	return 'node';
}

export function getVitestTestsByProject( rootDir ) {
	const testsByProject = Object.fromEntries(
		VITEST_PROJECT_NAMES.map( ( projectName ) => [ projectName, [] ] )
	);

	for ( const testPath of discoverTestFiles( rootDir ) ) {
		testsByProject[ getVitestProjectName( testPath ) ].push( testPath );
	}

	return testsByProject;
}

export function getVitestTests( rootDir ) {
	return [
		...new Set(
			Object.values( getVitestTestsByProject( rootDir ) ).flat()
		),
	].sort();
}
