/**
 * Internal dependencies
 */
import usePrevious from '../use-previous';

/**
 * Hook that performs a shallow comparison between the previous value of an object
 * and the new one, if there's a difference, it prints it to the console.
 * This is useful in performance related work, to check why a component re-renders.
 *
 *  @example
 *
 * ```tsx
 * function MyComponent(props: Record<string, any>) {
 *    useWarnOnChange(props);
 *
 *    return "Something";
 * }
 * ```
 *
 * @param object Object which changes to compare.
 * @param prefix Just a prefix to show when console logging.
 */
function useWarnOnChange(
	object: Record< string, any > | any[],
	prefix: string = 'Change detection'
): void {
	const previousValues = usePrevious( object );

	Object.entries( previousValues ?? [] ).forEach( ( [ key, value ] ) => {
		if ( value !== object[ key as keyof typeof object ] ) {
			// eslint-disable-next-line no-console
			console.warn(
				`${ prefix }: ${ key } key changed:`,
				value,
				object[ key as keyof typeof object ]
			);
		}
	} );
}

export default useWarnOnChange;
