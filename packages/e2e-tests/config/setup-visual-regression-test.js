/**
 * External dependencies
 */
import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const ARTIFACTS_PATH = root + '/artifacts';

// All available options: https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
const toMatchImageSnapshot = configureToMatchImageSnapshot( {
	customDiffDir: ARTIFACTS_PATH,
} );

// Extend Jest's "expect" with image snapshot functionality.
expect.extend( { toMatchImageSnapshot } );
