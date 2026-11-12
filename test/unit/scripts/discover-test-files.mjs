import path from 'node:path';
import { globSync } from 'glob';

/*
 * Extension glob shared by every pattern below. Node runs `.mts` and `.cts`
 * through type stripping, so they are discovered wherever `.ts` is.
 */
const TEST_EXT = '@([cm]js|[cm]ts|js|jsx|ts|tsx)';

export const TEST_PATTERNS = [
	`**/__tests__/**/*.${ TEST_EXT }`,
	`**/test/*.${ TEST_EXT }`,
	`**/?(*.)test.${ TEST_EXT }`,
];

export const TEST_IGNORES = [
	'**/.git/**',
	'**/node_modules/**',
	'packages/e2e-tests/**',
	'packages/e2e-test-utils-playwright/src/test.ts',
	// Runs under `node --test`, not Vitest.
	'test/ai-development/**',
	'**/build/**',
	'**/build-module/**',
	'**/build-types/**',
	'**/*.d.ts',
	'**/*.d.mts',
	'**/*.d.cts',
	'vendor/**',
];

export const VITEST_PROJECT_NAMES = [ 'node', 'jsdom', 'browser' ];

const TEST_EXT_PATTERN = '(?:[cm]js|[cm]ts|js|jsx|ts|tsx)';
const JSDOM_TEST_PATH_PATTERN = new RegExp(
	`\\.jsdom\\.test\\.${ TEST_EXT_PATTERN }$`
);
const BROWSER_TEST_PATH_PATTERN = new RegExp(
	`\\.browser\\.test\\.${ TEST_EXT_PATTERN }$`
);

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

export function getTestEnvironmentName( testPath ) {
	if ( BROWSER_TEST_PATH_PATTERN.test( testPath ) ) {
		return 'browser';
	}

	if ( JSDOM_TEST_PATH_PATTERN.test( testPath ) ) {
		return 'jsdom';
	}

	return 'node';
}

export function getVitestTestsByProject( discoveredTests ) {
	const testsByProject = Object.fromEntries(
		VITEST_PROJECT_NAMES.map( ( projectName ) => [ projectName, [] ] )
	);

	for ( const testPath of discoveredTests ) {
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
