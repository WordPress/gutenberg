/**
 * External dependencies
 */
import { eventEmitter, initialMode, DarkModeContext } from 'react-native-dark-mode';

let mode = initialMode;

eventEmitter.on( 'currentModeChanged', ( newMode ) => {
	mode = newMode;
} );

export function useStyle( light, dark ) {
	const finalDark = {
		...light,
		...dark,
	};

	return mode === 'dark' ? finalDark : light;
}

export const DarkMode = {};
DarkMode.Context = DarkModeContext;
