/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { WebrtcProviderWithHttpSignaling } from './webrtc-http-stream-signaling';
import type { ConnectDoc, CRDTDoc, ObjectID, ObjectType } from './types';

export interface WebRTCConnectionConfig {
	signaling: string[];
	password?: string;
}

/**
 * Function that creates a new WebRTC Connection.
 *
 * @param {WebRTCConnectionConfig} config Configuration for the WebRTC connection.
 * @return {ConnectDoc} Promise that resolves when the connection is established.
 */
export function createWebRTCConnection( {
	signaling,
	password,
}: WebRTCConnectionConfig ): ConnectDoc {
	return function (
		objectId: ObjectID,
		objectType: ObjectType,
		doc: CRDTDoc
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
