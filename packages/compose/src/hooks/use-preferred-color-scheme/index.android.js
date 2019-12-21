/**
 * External dependencies
 */
import { getPreferredColorScheme } from 'react-native-gutenberg-bridge';
import { useState, useEffect } from 'react';

/**
 * Returns the color scheme value when it changes. Possible values: [ 'light', 'dark' ]
 *
 * @return {string} return current color scheme.
 */

const usePreferredColorScheme = function() {
	const [ currentMode, setCurrentMode ] = useState( 'light' );
	useEffect( () => {
		getPreferredColorScheme( ( mode ) => {
			if ( mode !== currentMode ) {
				setCurrentMode( mode );
			}
		} );
	} );
	return currentMode;
};

export default usePreferredColorScheme;
