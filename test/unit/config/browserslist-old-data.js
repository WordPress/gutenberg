/**
 * External dependencies
 */
const browserslistEnv = require( 'browserslist/node' );

// Browserslist warns when its bundled caniuse-lite data is more than six months
// old, and `@wordpress/jest-console` turns that warning into a test failure.
// The data this branch depends on will never be updated, so the check would
// fail on every run indefinitely. The version of Browserslist used here
// predates the `BROWSERSLIST_IGNORE_OLD_DATA` environment variable, so the
// check is disabled directly instead.
browserslistEnv.oldDataWarning = () => {};
