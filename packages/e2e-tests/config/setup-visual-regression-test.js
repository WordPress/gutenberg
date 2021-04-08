/**
 * External dependencies
 */
import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const ARTIFACTS_PATH = root + '/artifacts';

function slugify( testName ) {
	const slug = testName
		.toLowerCase()
		.replace( /:/g, '-' )
		.replace( /[^0-9a-zA-Z \-\(\)]/g, '' )
		.replace( / /g, '-' );
	return slug;
}

// All available options: https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
const toMatchImageSnapshot = configureToMatchImageSnapshot( {
	customDiffDir: ARTIFACTS_PATH,
	customSnapshotIdentifier: ( { currentTestName } ) =>
		slugify( currentTestName ),
} );

// Extend Jest's "expect" with image snapshot functionality.
expect.extend( { toMatchImageSnapshot } );
