/**
 * External dependencies
 */
import { createServer } from 'http';
import type { AddressInfo, Socket } from 'net';
import { test, expect } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

test( 'RequestUtils does not reuse HTTP connections when closeConnections is enabled', async () => {
	const connections: Socket[] = [];
	const connectionHeaders: Array< string | undefined > = [];
	const server = createServer( ( request, response ) => {
		connections.push( request.socket );
		connectionHeaders.push( request.headers.connection );

		if (
			connections.length === 2 &&
			connections[ 0 ] === connections[ 1 ]
		) {
			request.socket.destroy();
			return;
		}

		response.end( 'ok' );
	} );

	await new Promise< void >( ( resolve ) => {
		server.listen( 0, '127.0.0.1', resolve );
	} );

	try {
		const { port } = server.address() as AddressInfo;
		const requestUtils = await RequestUtils.setup( {
			baseURL: `http://127.0.0.1:${ port }`,
			closeConnections: true,
		} );

		try {
			await requestUtils.request.get( '/' );
			await requestUtils.request.get( '/' );

			expect( connectionHeaders ).toEqual( [ 'close', 'close' ] );
			expect( connections ).toHaveLength( 2 );
			expect( connections[ 0 ] ).not.toBe( connections[ 1 ] );
		} finally {
			await requestUtils.request.dispose();
		}
	} finally {
		await new Promise< void >( ( resolve, reject ) => {
			server.close( ( error ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve();
				}
			} );
		} );
	}
} );
