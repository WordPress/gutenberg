/**
 * External dependencies
 */
import { useColorScheme } from 'react-native';

/**
 * Returns the color scheme value when it changes. Possible values: [ 'light', 'dark' ]
 *
 * @return {string} return current color scheme.
 */
const usePreferredColorScheme = useColorScheme;

export default usePreferredColorScheme;
