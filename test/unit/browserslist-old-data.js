/**
 * External dependencies
 */
const { dirname } = require( 'path' );

// Browserslist warns when its bundled caniuse-lite data is more than six months
// old, and `@wordpress/jest-console` turns that warning into a test failure.
// The data this branch depends on will never be updated, so the check would
// fail on every run indefinitely. The version of Browserslist used here
// predates the `BROWSERSLIST_IGNORE_OLD_DATA` environment variable, so the
// check is disabled directly instead.
//
// The tests reach Browserslist through `@babel/preset-env`, which depends on a
// newer version than the one at the root of `node_modules`, so the copy it
// loads is the one that needs the change.
const browserslistEnv = require( require.resolve( 'browserslist/node', {
	paths: [ dirname( require.resolve( '@babel/preset-env/package.json' ) ) ],
} ) );

browserslistEnv.oldDataWarning = () => {};
