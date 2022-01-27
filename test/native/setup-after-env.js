/**
 * Internal dependencies
 */
import { toBeVisible } from './matchers/to-be-visible';

// Extend expect matchers
expect.extend( {
	toBeVisible,
} );
