import { describe, expect, it } from 'vitest';
import type { FetchHandler } from '../../types';
import mediaUploadMiddleware from '../media-upload';

describe( 'Media Upload Middleware', () => {
	it( 'should defer to the next middleware with the same options', () => {
		expect.hasAssertions();

		const originalOptions = { path: '/wp/v2/media' };
		const next: FetchHandler = async ( options ) => {
			expect( options ).toBe( originalOptions );
		};

		mediaUploadMiddleware( originalOptions, next );
	} );

	it( 'should change options not to parse', () => {
		expect.hasAssertions();

		const requestOptions = { method: 'POST', path: '/wp/v2/media' };
		const next: FetchHandler = async ( options ) => {
			expect( options.parse ).toBe( false );

			return {
				status: 200,
				json() {
					return Promise.resolve( [ 'item' ] );
				},
			};
		};

		mediaUploadMiddleware( requestOptions, next );
	} );
} );
