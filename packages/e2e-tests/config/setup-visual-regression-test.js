/**
 * External dependencies
 */
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extend Jest's "expect" with image snapshot functionality.
expect.extend( { toMatchImageSnapshot } );
