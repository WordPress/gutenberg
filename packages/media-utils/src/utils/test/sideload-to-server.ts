/**
 * Internal dependencies
 */
import { sideloadToServer } from '../sideload-to-server';
import {
	xhrState,
	installMockXhr,
	uninstallMockXhr,
} from '../test-utils/mock-xhr';

// Mock apiFetch as both a callable function and an object with nonceMiddleware.
const mockApiFetch = jest.fn() as jest.Mock & {
	nonceMiddleware?: { nonce: string };
};
mockApiFetch.nonceMiddleware = { nonce: 'test-nonce-123' };

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: Object.assign( ( ...args: any[] ) => mockApiFetch( ...args ), {
		nonceMiddleware: { nonce: 'test-nonce-123' },
	} ),
} ) );

jest.mock( '../build-rest-url', () => ( {
	buildRestUrl: ( path: string ) => `https://example.com/wp-json${ path }`,
} ) );

jest.mock( '../create-upload-form-data', () => ( {
	createSideloadFormData: () => new FormData(),
} ) );

jest.mock( '../transform-attachment', () => ( {
	transformAttachment: ( response: any ) => ( {
		...response,
		__transformed: true,
	} ),
} ) );

const makeResponse = ( id = 1 ) =>
	JSON.stringify( {
		id,
		alt_text: '',
		source_url: 'http://example.com/img.jpg',
		caption: { raw: '' },
		title: { raw: '' },
	} );

describe( 'sideloadToServer', () => {
	beforeEach( () => {
		installMockXhr();
	} );

	afterEach( () => {
		jest.clearAllMocks();
		uninstallMockXhr();
	} );

	// --- apiFetch path ---

	it( 'should use apiFetch with correct sideload path including attachment ID', async () => {
		mockApiFetch.mockResolvedValueOnce( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );

		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );
		await sideloadToServer( file, 42 );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/media/42/sideload',
				method: 'POST',
			} )
		);
	} );

	// --- XHR path ---

	it( 'should use XHR with URL containing attachment ID', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = makeResponse();
		xhrState.instance.onload();

		await promise;

		expect( xhrState.instance.open ).toHaveBeenCalledWith(
			'POST',
			expect.stringContaining( '/wp/v2/media/42/sideload' )
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should report progress during sideload', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		xhrState.instance.upload.onprogress( {
			lengthComputable: true,
			loaded: 75,
			total: 100,
		} );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = makeResponse();
		xhrState.instance.onload();

		await promise;

		expect( onProgress ).toHaveBeenCalledWith( 75 );
	} );

	it( 'should resolve with transformed attachment on success', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = makeResponse( 99 );
		xhrState.instance.onload();

		const result = await promise;
		expect( ( result as any ).__transformed ).toBe( true );
		expect( ( result as any ).id ).toBe( 99 );
	} );

	it( 'should reject with network error on onerror', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		xhrState.instance.onerror();

		await expect( promise ).rejects.toThrow(
			'Network error during upload'
		);
	} );

	it( 'should reject with status message on non-JSON error response', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		xhrState.instance.status = 403;
		xhrState.instance.responseText = 'Forbidden';
		xhrState.instance.onload();

		await expect( promise ).rejects.toThrow(
			'Upload failed with status 403'
		);
	} );

	it( 'should reject immediately if signal is already aborted', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const controller = new AbortController();
		controller.abort();

		const promise = sideloadToServer(
			file,
			42,
			{},
			controller.signal,
			onProgress
		);

		await expect( promise ).rejects.toThrow( 'Aborted' );
		expect( xhrState.instance ).toBeNull();
	} );

	it( 'should call xhr.abort() when signal is aborted mid-upload', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const controller = new AbortController();
		const promise = sideloadToServer(
			file,
			42,
			{},
			controller.signal,
			onProgress
		);

		controller.abort();
		expect( xhrState.instance.abort ).toHaveBeenCalled();

		xhrState.instance.onabort();

		await expect( promise ).rejects.toThrow( 'Aborted' );
	} );
} );
