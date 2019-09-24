/**
 * External dependencies
 */
import { useDarkModeContext } from 'react-native-dark-mode';

/**
 * Returns the color scheme value when it changes. Possible values: [ 'light', 'dark' ]
 *
 * @return {string} return current color scheme.
 */
const usePreferredColorScheme = useDarkModeContext;

export default usePreferredColorScheme;
