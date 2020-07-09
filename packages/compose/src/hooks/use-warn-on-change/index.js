/**
 * Internal dependencies
 */
import usePrevious from '../use-previous';

function useWarnOnChange( object, prefix = 'Change detection' ) {
	const previousValues = usePrevious( object );

	Object.entries( previousValues || [] ).forEach( ( [ key, value ] ) => {
		if ( value !== object[ key ] ) {
			// eslint-disable-next-line no-console
			console.warn(
				prefix + ': ' + key + ' key changed:',
				value,
				object[ key ]
			);
		}
	} );
}

export default useWarnOnChange;
