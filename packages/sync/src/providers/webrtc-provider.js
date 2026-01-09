/**
 * External dependencies
 */
// import { WebrtcProvider } from 'y-webrtc';

/**
 * Internal dependencies
 */
import { WebrtcProviderWithHttpSignaling } from './webrtc-http-stream-signaling';

/** @typedef {import('../types').ObjectType} ObjectType */
/** @typedef {import('../types').ObjectID} ObjectID */
/** @typedef {import('../types').CRDTDoc} CRDTDoc */
/** @typedef {import('../types').ProviderCreator} ProviderCreator */

/**
 * Function that creates a new WebRTC Connection.
 *
 * @param {Object}           config
 * @param {Array<string>}    config.signaling
 * @param {string|undefined} config.password
 * @return {ProviderCreator} Promise that resolves when the connection is established.
 */
export function createWebRTCProvider( { signaling, password } ) {
	return function (
		/** @type {ObjectType} */ objectType,
		/** @type {ObjectID} */ objectId,
		/** @type {CRDTDoc} */ doc
	) {
		const roomName = `${ objectType }-${ objectId }`;
		const provider = new WebrtcProviderWithHttpSignaling( roomName, doc, {
			signaling,
			password,
		} );

		return Promise.resolve( {
			destroy: () => provider.destroy(),
		} );
	};
}
