/**
 * Node dependencies
 */
import { createHash } from 'node:crypto';
import path from 'node:path';

/**
 * External dependencies
 */
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

export const VITEST_PROJECT_NAMES = [ 'browser', 'jsdom', 'node' ];

export function assertVitestProjectNames( label, projects ) {
	const actualProjectNames = Object.keys( projects ).sort();
	const expectedProjectNames = [ ...VITEST_PROJECT_NAMES ].sort();

	if (
		actualProjectNames.length !== expectedProjectNames.length ||
		actualProjectNames.some(
			( projectName, index ) =>
				projectName !== expectedProjectNames[ index ]
		)
	) {
		throw new Error(
			`${ label } must define exactly these projects: ${ VITEST_PROJECT_NAMES.join(
				', '
			) }.`
		);
	}
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

export function getVitestTestsForProject( rootDir, manifest, projectName ) {
	const discoveredTests = discoverTestFiles( rootDir );
	const project = manifest.vitest.projects[ projectName ];
	const directoryTests = discoveredTests.filter( ( testPath ) =>
		project.directories.some(
			( directoryPath ) =>
				testPath === directoryPath ||
				testPath.startsWith( `${ directoryPath }/` )
		)
	);

	return [
		...new Set( [
			...project.files,
			...directoryTests,
			...manifest.added.vitest[ projectName ],
		] ),
	].sort();
}

export function getVitestTestsByProject( rootDir, manifest ) {
	assertVitestProjectNames( 'vitest.projects', manifest.vitest.projects );
	assertVitestProjectNames( 'added.vitest', manifest.added.vitest );

	return Object.fromEntries(
		VITEST_PROJECT_NAMES.map( ( projectName ) => [
			projectName,
			getVitestTestsForProject( rootDir, manifest, projectName ),
		] )
	);
}

export function getVitestTests( rootDir, manifest ) {
	return [
		...new Set(
			Object.values( getVitestTestsByProject( rootDir, manifest ) ).flat()
		),
	].sort();
}

export function hashTestFiles( testFiles ) {
	return createHash( 'sha256' )
		.update( [ ...testFiles ].sort().join( '\n' ) )
		.digest( 'hex' );
}
