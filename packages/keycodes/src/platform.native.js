import { Platform } from 'react-native';

/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window   window object by default; used for DI testing.
 *
 * @return {boolean}         True if iOS; false otherwise.
 */
// eslint-disable-next-line no-unused-vars
export function isAppleOS( _window = window ) {
	return Platform.OS === 'ios';
}
