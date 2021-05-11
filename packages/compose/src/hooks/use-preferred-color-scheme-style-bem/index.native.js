/**
 * Internal dependencies
 */
import usePreferredColorScheme from '../use-preferred-color-scheme';

/**
 * Reduces style objects by the user's preferred color scheme and by platform.
 * Dark styles are selected by the BEM naming convention i.e. block__element--modifier
 *
 * The "light" color schemed is assumed to be the default, and its styles are
 * always applied. The "dark" styles will always extend those defined for the
 * light case.
 *
 * @example
 * const styles = { 
			'block__element': {padding: 10, backgroundColor: 'white' },
			'block__element--dark': { backgroundColor: 'black' }
	 };
 * usePreferredColorSchemeStyle(styles);
 * // On light mode:
 * // => { 'block_element' : { padding: 10, backgroundColor: 'white' } }
 * // On dark mode:
 * // => { 'block_element' : { padding: 10, backgroundColor: 'black' } }
 * @param {Object} styles
 * @param {string} darkModifier
 * @return {Object} the combined styles depending on the current color scheme
 */
const usePreferredColorSchemeStyleBem = (
	styles,
	darkModifier = 'dark'
) => {
	const colorScheme = usePreferredColorScheme();

	if ( colorScheme !== 'dark' ) {
		return styles;
	}

	const darkSelectors = Object.keys( styles ).filter( ( selector ) =>
		selector.match( `-{1,2}${ darkModifier }` )
	);

	darkSelectors.forEach( ( darkSelector ) => {
		const lightSelector = darkSelector
			.replace( `-${ darkModifier }`, '' )
			.replace( /-$/, '' );

		styles[ lightSelector ] = {
			...styles[ lightSelector ],
			...styles[ darkSelector ],
		};
	} );

	return styles;
};

export default usePreferredColorSchemeStyleBem;
