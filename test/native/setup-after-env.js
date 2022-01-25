/**
 * Internal dependencies
 */
import { toBeVisible } from './custom-matchers/to-be-visible';

// Extend expect matchers
expect.extend( {
	toBeVisible,
} );
