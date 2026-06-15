/**
 * Internal dependencies
 */
import usePrevious from '../use-previous';

// Disable reason: Object and object are distinctly different types in TypeScript and we mean the lowercase object in this case
// but eslint wants to force us to use `Object`. See https://stackoverflow.com/questions/49464634/difference-between-object-and-object-in-typescript
/* eslint-disable jsdoc/check-types */
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
 * @param {object} object Object which changes to compare.
 * @param {string} prefix Just a prefix to show when console logging.
 */
function useWarnOnChange( object, prefix = 'Change detection' ) {
	const previousValues = usePrevious( object );

	Object.entries( previousValues ?? [] ).forEach( ( [ key, value ] ) => {
		if ( value !== object[ /** @type {keyof typeof object} */ ( key ) ] ) {
			// eslint-disable-next-line no-console
			console.warn(
				`${ prefix }: ${ key } key changed:`,
				value,
				object[ /** @type {keyof typeof object} */ ( key ) ]
				/* eslint-enable jsdoc/check-types */
			);
		}
	} );
}

export default useWarnOnChange;
