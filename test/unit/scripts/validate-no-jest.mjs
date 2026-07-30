/**
 * Node dependencies
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * External dependencies
 */
import globPackage from 'glob';

const { sync: glob } = globPackage;
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const SELF = 'test/unit/scripts/validate-no-jest.mjs';
const LEGACY_REPORT_DIRECTORY = 'packages/report-flaky-tests/';
const LEGACY_FIXTURE_DIRECTORY = 'tools/release/commands/test/fixtures/';
const ALLOWED_RUNNER_NEUTRAL_PACKAGES = new Set( [
	'@emotion/jest',
	'@testing-library/jest-dom',
	'eslint-plugin-jest-dom',
] );
const DEPENDENCY_SECTIONS = [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
];
const violations = [];

function isRetiredJestDependency( dependency ) {
	return (
		dependency === 'jest' ||
		dependency === '@flakiness/jest' ||
		dependency === '@types/jest' ||
		dependency === 'babel-jest' ||
		dependency === 'eslint-plugin-jest' ||
		dependency.startsWith( '@jest/' ) ||
		dependency.startsWith( '@wordpress/jest-' ) ||
		dependency.startsWith( 'jest-' )
	);
}

const packageFiles = glob( '**/package.json', {
	cwd: ROOT_DIR,
	ignore: [ '**/node_modules/**', '**/build/**', '**/build-module/**' ],
	nodir: true,
} );

for ( const packageFile of packageFiles ) {
	if ( packageFile.startsWith( LEGACY_REPORT_DIRECTORY ) ) {
		continue;
	}

	const packageJson = JSON.parse(
		readFileSync( path.join( ROOT_DIR, packageFile ), 'utf8' )
	);

	for ( const section of DEPENDENCY_SECTIONS ) {
		for ( const dependency of Object.keys(
			packageJson[ section ] ?? {}
		) ) {
			if (
				! ALLOWED_RUNNER_NEUTRAL_PACKAGES.has( dependency ) &&
				isRetiredJestDependency( dependency )
			) {
				violations.push(
					`${ packageFile }: ${ section } declares ${ dependency }`
				);
			}
		}
	}

	for ( const [ scriptName, command ] of Object.entries(
		packageJson.scripts ?? {}
	) ) {
		if (
			/(?:^|\s)(?:npx\s+)?jest(?:\s|$)|jest\.config|test-unit-jest/.test(
				command
			)
		) {
			violations.push(
				`${ packageFile }: script ${ scriptName } invokes Jest`
			);
		}
	}
}

const activeFiles = glob(
	'**/*.{bash,cjs,cts,js,jsx,json,mjs,mts,sh,ts,tsx,yaml,yml}',
	{
		cwd: ROOT_DIR,
		dot: true,
		ignore: [
			'**/node_modules/**',
			'**/build/**',
			'**/build-module/**',
			'**/build-types/**',
			'**/CHANGELOG.md',
			'changelog.txt',
			'docs/**',
			'package-lock.json',
			`${ LEGACY_REPORT_DIRECTORY }**`,
			`${ LEGACY_FIXTURE_DIRECTORY }**`,
			SELF,
		],
		nodir: true,
	}
);

const retiredUsagePatterns = [
	[ /\bjest\s*\./, 'Jest global' ],
	[ /@jest-environment/, 'Jest environment directive' ],
	[ /\bnamespace\s+jest\b/, 'Jest type namespace' ],
	[
		/(?:from\s+|import\s*\(|require\s*\()\s*['"](?:@jest\/|jest(?:-|['"]))/,
		'Jest import',
	],
	[ /['"]jest\/[a-z-]+['"]/, 'Jest lint rule' ],
	[
		/@flakiness\/jest|@wordpress\/jest-|@types\/jest|babel-jest|eslint-plugin-jest(?!-dom)|jest-(?:circus|environment|jasmine|junit|matcher|message|mock|preset|runner|watch|worker)/,
		'Jest package reference',
	],
	[ /jest\.config|test-unit-jest/, 'Jest configuration or command' ],
];

for ( const activeFile of activeFiles ) {
	const basename = path.basename( activeFile ).toLowerCase();
	if ( basename.includes( 'jest' ) ) {
		violations.push( `${ activeFile }: Jest-named active file` );
	}
	if ( basename === 'package.json' ) {
		continue;
	}

	let source = readFileSync( path.join( ROOT_DIR, activeFile ), 'utf8' );
	for ( const allowedPackage of ALLOWED_RUNNER_NEUTRAL_PACKAGES ) {
		source = source.replaceAll( allowedPackage, 'allowed-test-package' );
	}

	for ( const [ pattern, label ] of retiredUsagePatterns ) {
		if ( pattern.test( source ) ) {
			violations.push( `${ activeFile }: ${ label }` );
		}
	}
}

if ( violations.length ) {
	throw new Error(
		`Active Jest usage remains outside the legacy-report allowlist:\n${ violations.join(
			'\n'
		) }`
	);
}

console.log(
	`Validated Jest removal across ${ packageFiles.length } package manifests and ${ activeFiles.length } active source/configuration files.`
);
