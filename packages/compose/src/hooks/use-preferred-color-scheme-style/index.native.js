/**
 * Internal dependencies
 */
import usePreferredColorScheme from '../use-preferred-color-scheme';

/**
 * Selects which of the passed style objects should be applied depending on the
 * user's preferred color scheme.
 *
 * The "light" color schemed is assumed to be the default, and its styles are
 * always applied. The "dark" styles will always extend those defined for the
 * light case.
 *
 * @example
 * const light = { padding: 10, backgroundColor: 'white' };
 * const dark = { backgroundColor: 'black' };
 * usePreferredColorSchemeStyle( light, dark);
 * // On light mode:
 * // => { padding: 10, backgroundColor: 'white' }
 * // On dark mode:
 * // => { padding: 10, backgroundColor: 'black' }
 * @param {Object} lightStyle
 * @param {Object} darkStyle
 * @return {Object} the combined styles depending on the current color scheme
 */
const usePreferredColorSchemeStyle = ( lightStyle, darkStyle ) => {
	const colorScheme = usePreferredColorScheme();
	const isDarkMode = colorScheme === 'dark';

	return isDarkMode ? { ...lightStyle, ...darkStyle } : lightStyle;
};

export default usePreferredColorSchemeStyle;
