const { createRequire } = require( 'node:module' );
const path = require( 'node:path' );

// Keep the legacy test environment while delegating configuration to Jest.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

const consumerRequire = createRequire( path.resolve( 'package.json' ) );
let jestCli;
try {
	jestCli = consumerRequire.resolve( 'jest/bin/jest' );
} catch ( error ) {
	if ( error.code !== 'MODULE_NOT_FOUND' ) {
		throw error;
	}
	console.error(
		'wp-scripts test-unit-jest requires a project-installed Jest. ' +
			'Install it with npm install --save-dev jest@^30. ' +
			'See @wordpress/scripts/docs/vitest-migration.md for legacy configuration.'
	);
	process.exit( 1 );
}

require( jestCli );
