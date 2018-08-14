import { Platform } from 'react-native';

/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window   window object by default; used for DI testing.
 *
 * @return {boolean}         True if iOS; false otherwise.
 */
export function isAppleOS( _window = window ) {		
	return Platform.Version === 'ios';
}