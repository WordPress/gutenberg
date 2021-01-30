/* eslint-disable jsdoc/valid-types */
/**
 * Function invoking callback after delay with current timestamp in milliseconds
 * since epoch.
 *
 * @param {(timestamp:number=>void} callback Callback function.
 */
export default function invokeCallbackAfterDelay( callback ) {
	setTimeout( () => callback( Date.now() ), 1000 );
}
/* eslint-enable jsdoc/valid-types */
