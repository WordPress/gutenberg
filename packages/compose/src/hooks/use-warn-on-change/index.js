/**
 * Internal dependencies
 */
import usePrevious from '../use-previous';

/* eslint-disable jsdoc/valid-types */
/**
 * Hook that performs a shallow comparison between the previous values of an object
 * and the new ones. If there's a difference, it prints it to the console.
 * This is useful in performance related work to understand why a component re-renders.
 *
 *  @example
 *
 * ```jsx
 * function MyComponent(props) {
 *    useWarnOnChange(props);
 *
 *    return "Something";
 * }
 * ```
 *
 * @param {{[K: string]: unknown}} object Object which changes to compare.
 * @param {string} [prefix='Change detection'] Just a prefix to show when console logging.
 */
function useWarnOnChange( object, prefix = 'Change detection' ) {
	const previousValues = usePrevious( object );

	Object.entries( previousValues ?? [] ).forEach( ( [ key, value ] ) => {
		if ( value !== object[ key ] ) {
			// eslint-disable-next-line no-console
			console.warn(
				`${ prefix }: ${ key } key changed:`,
				value,
				object[ key ]
			);
		}
	} );
}
/* eslint-enable jsdoc/valid-types */

export default useWarnOnChange;
