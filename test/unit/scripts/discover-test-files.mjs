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
					dot: true,
					ignore: TEST_IGNORES,
					nodir: true,
				} )
			).map( normalizeTestPath )
		),
	].sort();
}

export function getVitestTests( discoveredTests, manifest ) {
	const directoryTests = discoveredTests.filter( ( testPath ) =>
		manifest.vitest.directories.some(
			( directoryPath ) =>
				testPath === directoryPath ||
				testPath.startsWith( `${ directoryPath }/` )
		)
	);

	return [
		...new Set( [ ...manifest.vitest.files, ...directoryTests ] ),
	].sort();
}
