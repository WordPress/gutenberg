/**
 * External dependencies
 */
// import { WebrtcProvider } from 'y-webrtc';

/**
 * Internal dependencies
 */
import { WebrtcProvider } from './webrtc-http-stream-signaling';

/** @typedef {import('./types').ObjectType} ObjectType */
/** @typedef {import('./types').ObjectID} ObjectID */
/** @typedef {import('./types').CRDTDoc} CRDTDoc */

/**
 * Connect function to the WebRTC provider.
 *
 * @param {ObjectID}   objectId   The object ID.
 * @param {ObjectType} objectType The object type.
 * @param {CRDTDoc}    doc        The CRDT document.
 *
 * @return {Promise<() => void>} Promise that resolves when the connection is established.
 */
export function connectWebRTC( objectId, objectType, doc ) {
	const docName = `${ objectType }-${ objectId }`;
	new WebrtcProvider( docName, doc, {
		signaling: [
			//'ws://localhost:4444',
			window.wp.ajax.settings.url,
		],
		// @ts-ignore
		password: window.__experimentalCollaborativeEditingSecret,
	} );
	return Promise.resolve( () => true );
}
