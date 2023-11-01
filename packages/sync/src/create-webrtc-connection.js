/**
 * External dependencies
 */
// import { WebrtcProvider } from 'y-webrtc';

/**
 * Internal dependencies
 */
import { WebrtcProviderWithHttpSignaling } from './webrtc-http-stream-signaling';

/** @typedef {import('./types').ObjectType} ObjectType */
/** @typedef {import('./types').ObjectID} ObjectID */
/** @typedef {import('./types').CRDTDoc} CRDTDoc */

/**
 * Function that creates a new WebRTC Connection.
 *
 * @param {Object}        config           The object ID.
 *
 * @param {Array<string>} config.signaling
 * @param {string}        config.password
 * @return {Function} Promise that resolves when the connection is established.
 */
export function createWebRTCConnection( { signaling, password } ) {
	return function (
		/** @type {string} */ objectId,
		/** @type {string} */ objectType,
		/** @type {import("yjs").Doc} */ doc
	) {
		const roomName = `${ objectType }-${ objectId }`;
		new WebrtcProviderWithHttpSignaling( roomName, doc, {
			signaling,
			// @ts-ignore
			password,
		} );

		return Promise.resolve( () => true );
	};
}
