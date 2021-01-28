/**
 * External dependencies
 */
import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

// All available options: https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
const toMatchImageSnapshot = configureToMatchImageSnapshot( {
	// Maximum diff to allow in px.
	failureThreshold: 1,
} );

// Extend Jest's "expect" with image snapshot functionality.
expect.extend( { toMatchImageSnapshot } );
