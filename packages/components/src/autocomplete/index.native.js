/**
 * Internal dependencies
 */
import Autocomplete from './index.js';

// Enable for development only
// eslint-disable-next-line no-undef
export default __DEV__ ? Autocomplete : () => null;
