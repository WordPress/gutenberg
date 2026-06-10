/**
 * Internal dependencies
 */
import type { FetchHandler } from '../../types';
import httpV1Middleware from '../http-v1';

describe( 'HTTP v1 Middleware', () => {
	it( 'should use a POST for a PUT requests', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.method ).toBe( 'POST' );
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'PUT'
			);
		};

		httpV1Middleware( { method: 'PUT', data: {} }, callback );
	} );

	it( "shouldn't touch the options for GET requests", () => {
		expect.hasAssertions();

		const requestOptions = { method: 'GET', path: '/wp/v2/posts' };
		const callback: FetchHandler = async ( options ) => {
			expect( options ).toBe( requestOptions );
		};

		httpV1Middleware( requestOptions, callback );
	} );

	it( "shouldn't touch the options for an undefined method", () => {
		expect.hasAssertions();

		const requestOptions = { path: '/wp/v2/posts' };
		const callback: FetchHandler = async ( options ) => {
			expect( options ).toBe( requestOptions );
		};

		httpV1Middleware( requestOptions, callback );
	} );

	it( 'should default Content-Type to application/json when no headers are set', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe(
				'application/json'
			);
		};

		httpV1Middleware( { method: 'PUT', data: {} }, callback );
	} );

	it( 'should default Content-Type to application/json when headers exist without Content-Type', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe(
				'application/json'
			);
			expect( options.headers![ 'X-Custom' ] ).toBe( 'value' );
		};

		httpV1Middleware(
			{
				method: 'PUT',
				headers: { 'X-Custom': 'value' },
				data: {},
			},
			callback
		);
	} );

	it( 'should respect a caller-provided Content-Type header', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe( 'text/plain' );
			expect( options.method ).toBe( 'POST' );
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'PUT'
			);
		};

		httpV1Middleware(
			{
				method: 'PUT',
				headers: { 'Content-Type': 'text/plain' },
				body: '# Markdown content',
			},
			callback
		);
	} );

	it( 'should respect Content-Type for PATCH requests', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe(
				'application/xml'
			);
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'PATCH'
			);
		};

		httpV1Middleware(
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/xml' },
				body: '<doc/>',
			},
			callback
		);
	} );

	it( 'should respect Content-Type for DELETE requests', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe( 'text/plain' );
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'DELETE'
			);
		};

		httpV1Middleware(
			{
				method: 'DELETE',
				headers: { 'Content-Type': 'text/plain' },
			},
			callback
		);
	} );

	it( 'should always set X-HTTP-Method-Override regardless of caller headers', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			// X-HTTP-Method-Override must not be overridable by the caller.
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'PUT'
			);
		};

		httpV1Middleware(
			{
				method: 'PUT',
				headers: { 'X-HTTP-Method-Override': 'DELETE' },
				data: {},
			},
			callback
		);
	} );

	it( 'should preserve other caller headers alongside Content-Type override', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.headers![ 'Content-Type' ] ).toBe(
				'text/markdown'
			);
			expect( options.headers!.Authorization ).toBe( 'Bearer token123' );
			expect( options.headers![ 'X-Custom-Header' ] ).toBe(
				'custom-value'
			);
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'PUT'
			);
		};

		httpV1Middleware(
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'text/markdown',
					Authorization: 'Bearer token123',
					'X-Custom-Header': 'custom-value',
				},
				body: '# Hello',
			},
			callback
		);
	} );

	it( 'should not modify GET requests even with custom Content-Type', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET' as const,
			path: '/wp/v2/posts',
			headers: { 'Content-Type': 'text/plain' },
		};

		const callback: FetchHandler = async ( options ) => {
			expect( options ).toBe( requestOptions );
		};

		httpV1Middleware( requestOptions, callback );
	} );

	it( 'should not modify POST requests', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'POST' as const,
			path: '/wp/v2/posts',
			headers: { 'Content-Type': 'text/plain' },
			body: 'raw content',
		};

		const callback: FetchHandler = async ( options ) => {
			expect( options ).toBe( requestOptions );
		};

		httpV1Middleware( requestOptions, callback );
	} );

	it( 'should handle case-insensitive method matching', () => {
		expect.hasAssertions();

		const callback: FetchHandler = async ( options ) => {
			expect( options.method ).toBe( 'POST' );
			expect( options.headers![ 'X-HTTP-Method-Override' ] ).toBe(
				'put'
			);
		};

		httpV1Middleware( { method: 'put', data: {} }, callback );
	} );

	it( 'should preserve the body when overriding Content-Type', () => {
		expect.hasAssertions();

		const markdownContent = '# Title\n\nSome **bold** text.\n';
		const callback: FetchHandler = async ( options ) => {
			expect( options.body ).toBe( markdownContent );
			expect( options.headers![ 'Content-Type' ] ).toBe( 'text/plain' );
		};

		httpV1Middleware(
			{
				method: 'PUT',
				headers: { 'Content-Type': 'text/plain' },
				body: markdownContent,
			},
			callback
		);
	} );
} );
