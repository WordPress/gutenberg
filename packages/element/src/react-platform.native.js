/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';

/**
 * Registers an app root component allowing the native system to run the app.
 *
 * @param {string}   appKey            Unique app name identifier.
 * @param {Function} componentProvider Function returning the app root React component.
 */
export const registerComponent = ( appKey, componentProvider ) => {
	AppRegistry.registerComponent( appKey, componentProvider );
};
