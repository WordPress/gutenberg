/**
 * External dependencies
 */
import { useDarkModeContext, eventEmitter } from 'react-native-dark-mode';

// Conditional needed to pass UI Tests on CI
if ( eventEmitter.setMaxListeners ) {
	eventEmitter.setMaxListeners( 150 );
}

/**
 * Returns the color scheme value when it changes. Possible values: [ 'light', 'dark' ]
 *
 * @return {string} return current color scheme.
 */
const usePreferredColorScheme = useDarkModeContext;

export default usePreferredColorScheme;
