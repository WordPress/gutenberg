/**
 * External dependencies
 */
// @ts-ignore
import { WebrtcProvider } from 'y-webrtc';

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
		// @ts-ignore
		password: window.__experimentalCollaborativeEditingSecret,
	} );

	return Promise.resolve( () => true );
}
