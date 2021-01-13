/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * Return true if platform is iOS.
 *
 * @return {boolean} True if iOS; false otherwise.
 */
export function isAppleOS() {
	return Platform.OS === 'ios';
}
