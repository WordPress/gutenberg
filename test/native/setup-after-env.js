/**
 * External dependencies
 */
import { cleanup } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { toBeVisible } from './matchers/to-be-visible';

// Extend expect matchers
expect.extend( {
	toBeVisible,
} );

// Automatically cleanup mounted React trees after rendering components with the React
// Native Testing Library. Although this is already done by the library, we provide our
// own logic in order to prevent unexpected "act" warnings after the test finishes.
// Reference: https://callstack.github.io/react-native-testing-library/docs/api#cleanup
afterEach( cleanup );
