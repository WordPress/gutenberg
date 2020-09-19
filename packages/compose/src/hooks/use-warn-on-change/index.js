/**
 * Internal dependencies
 */
import usePrevious from '../use-previous';

/**
 * Hook that performs a shallow comparison between the preview value of an object
 * and the new one, if there's a difference, it prints it to the console.
 * this is useful in performance related work, to check why a component re-renders.
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
 * @param {Object} object Object which changes to compare.
 * @param {string} prefix Just a prefix to show when console logging.
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

export default useWarnOnChange;
