/* eslint-disable no-console */
/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );
const { getArgFromCLI } = require( './node_modules/@wordpress/scripts/utils' );
const distTag = getArgFromCLI( '--dist-tag' ) || 'latest';

console.log(`Preparing backports using dist tag ${distTag}`);

console.log(`Step 1/3: Refresh JS packages`);
spawn.sync( 'node', ['./refresh-packages', `--dist-tag=${ distTag }`], {
	stdio: 'inherit',
} );

console.log(`Step 2/3: npm build`);
spawn.sync( 'npm', ['run', 'build'], {
	stdio: 'inherit',
} );

console.log(`Step 3/3: npm build:dev`);
spawn.sync( 'npm', ['run', 'build:dev'], {
	stdio: 'inherit',
	cwd: `${ __dirname }/src`,
} );
