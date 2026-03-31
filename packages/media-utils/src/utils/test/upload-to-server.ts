/**
 * Internal dependencies
 */
import { uploadToServer } from '../upload-to-server';
import { xhrState, installMockXhr, uninstallMockXhr } from './mock-xhr';

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
	createUploadFormData: () => new FormData(),
} ) );

jest.mock( '../transform-attachment', () => ( {
	transformAttachment: ( response: any ) => ( {
		...response,
		__transformed: true,
	} ),
} ) );

describe( 'uploadToServer', () => {
	beforeEach( () => {
		installMockXhr();
	} );

	afterEach( () => {
		jest.clearAllMocks();
		uninstallMockXhr();
	} );

	// --- apiFetch path (no onProgress) ---

	it( 'should use apiFetch when no onProgress callback is provided', async () => {
		const mockResponse = {
			id: 1,
			alt_text: 'test',
			source_url: 'http://example.com/image.jpg',
			caption: { raw: 'cap' },
			title: { raw: 'title' },
		};
		mockApiFetch.mockResolvedValueOnce( mockResponse );

		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const result = await uploadToServer( file );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/media?_embed=wp:featuredmedia',
				method: 'POST',
			} )
		);
		expect( ( result as any ).__transformed ).toBe( true );
	} );

	it( 'should pass signal to apiFetch', async () => {
		const controller = new AbortController();
		mockApiFetch.mockResolvedValueOnce( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );

		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		await uploadToServer( file, {}, controller.signal );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				signal: controller.signal,
			} )
		);
	} );

	it( 'should call transformAttachment on apiFetch response', async () => {
		mockApiFetch.mockResolvedValueOnce( {
			id: 42,
			alt_text: 'alt',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: 'My Image' },
		} );

		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const result = await uploadToServer( file );

		expect( ( result as any ).__transformed ).toBe( true );
		expect( ( result as any ).id ).toBe( 42 );
	} );

	// --- XHR path (with onProgress) ---

	it( 'should use XMLHttpRequest when onProgress is provided', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		// Simulate successful response.
		xhrState.instance.status = 200;
		xhrState.instance.responseText = JSON.stringify( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );
		xhrState.instance.onload();

		await promise;

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( xhrState.instance.open ).toHaveBeenCalledWith(
			'POST',
			expect.stringContaining( '/wp/v2/media' )
		);
	} );

	it( 'should set correct headers including nonce', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = JSON.stringify( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );
		xhrState.instance.onload();

		await promise;

		expect( xhrState.instance.setRequestHeader ).toHaveBeenCalledWith(
			'Accept',
			'application/json, */*;q=0.1'
		);
		expect( xhrState.instance.setRequestHeader ).toHaveBeenCalledWith(
			'X-WP-Nonce',
			'test-nonce-123'
		);
		expect( xhrState.instance.withCredentials ).toBe( true );
	} );

	it( 'should report progress via onProgress callback', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		// Simulate progress events.
		xhrState.instance.upload.onprogress( {
			lengthComputable: true,
			loaded: 50,
			total: 100,
		} );
		xhrState.instance.upload.onprogress( {
			lengthComputable: true,
			loaded: 100,
			total: 100,
		} );

		// Complete the upload.
		xhrState.instance.status = 200;
		xhrState.instance.responseText = JSON.stringify( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );
		xhrState.instance.onload();

		await promise;

		expect( onProgress ).toHaveBeenCalledWith( 50 );
		expect( onProgress ).toHaveBeenCalledWith( 100 );
	} );

	it( 'should not call onProgress when lengthComputable is false', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.upload.onprogress( {
			lengthComputable: false,
			loaded: 50,
			total: 0,
		} );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = JSON.stringify( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );
		xhrState.instance.onload();

		await promise;

		expect( onProgress ).not.toHaveBeenCalled();
	} );

	it( 'should resolve with transformed attachment on 2xx success', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 201;
		xhrState.instance.responseText = JSON.stringify( {
			id: 99,
			alt_text: 'my alt',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: 'cap' },
			title: { raw: 'title' },
		} );
		xhrState.instance.onload();

		const result = await promise;
		expect( ( result as any ).__transformed ).toBe( true );
		expect( ( result as any ).id ).toBe( 99 );
	} );

	it( 'should reject with parsed error object on non-2xx JSON response', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 400;
		xhrState.instance.responseText = JSON.stringify( {
			code: 'rest_upload_invalid',
			message: 'Invalid upload',
		} );
		xhrState.instance.onload();

		await expect( promise ).rejects.toEqual( {
			code: 'rest_upload_invalid',
			message: 'Invalid upload',
		} );
	} );

	it( 'should reject with status-text error on non-2xx non-JSON response', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 500;
		xhrState.instance.responseText = 'Internal Server Error';
		xhrState.instance.onload();

		await expect( promise ).rejects.toThrow(
			'Upload failed with status 500'
		);
	} );

	it( 'should reject with "Invalid JSON response" on 2xx non-JSON response', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = 'not json';
		xhrState.instance.onload();

		await expect( promise ).rejects.toThrow( 'Invalid JSON response' );
	} );

	it( 'should reject with "Network error during upload" on onerror', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.onerror();

		await expect( promise ).rejects.toThrow(
			'Network error during upload'
		);
	} );

	it( 'should reject with DOMException AbortError on onabort', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.onabort();

		await expect( promise ).rejects.toThrow( 'Aborted' );
		const error = await promise.catch( ( e: unknown ) => e );
		expect( ( error as DOMException ).name ).toBe( 'AbortError' );
	} );

	it( 'should reject immediately if signal is already aborted', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const controller = new AbortController();
		controller.abort();

		const promise = uploadToServer(
			file,
			{},
			controller.signal,
			onProgress
		);

		await expect( promise ).rejects.toThrow( 'Aborted' );
		// No XHR should have been created.
		expect( xhrState.instance ).toBeNull();
	} );

	it( 'should call xhr.abort() when signal is aborted mid-upload', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const controller = new AbortController();
		const promise = uploadToServer(
			file,
			{},
			controller.signal,
			onProgress
		);

		// Abort mid-upload.
		controller.abort();

		expect( xhrState.instance.abort ).toHaveBeenCalled();

		// Simulate the onabort callback that XHR would fire.
		xhrState.instance.onabort();

		await expect( promise ).rejects.toThrow( 'Aborted' );
	} );

	it( 'should not set X-WP-Nonce when nonceMiddleware is unavailable', async () => {
		// Temporarily remove nonceMiddleware from the mock.
		const apiFetchModule = jest.requireMock( '@wordpress/api-fetch' );
		const originalNonce = apiFetchModule.default.nonceMiddleware;
		apiFetchModule.default.nonceMiddleware = undefined;

		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const promise = uploadToServer( file, {}, undefined, onProgress );

		xhrState.instance.status = 200;
		xhrState.instance.responseText = JSON.stringify( {
			id: 1,
			alt_text: '',
			source_url: 'http://example.com/img.jpg',
			caption: { raw: '' },
			title: { raw: '' },
		} );
		xhrState.instance.onload();

		await promise;

		const nonceCall = xhrState.instance.setRequestHeader.mock.calls.find(
			( [ name ]: [ string ] ) => name === 'X-WP-Nonce'
		);
		expect( nonceCall ).toBeUndefined();

		// Restore.
		apiFetchModule.default.nonceMiddleware = originalNonce;
	} );
} );
