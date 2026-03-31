/**
 * Internal dependencies
 */
import { sideloadToServer } from '../sideload-to-server';

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

// XHR mock.
let mockXhrInstance: any;

class MockXMLHttpRequest {
	upload: { onprogress: ( ( e: any ) => void ) | null };
	onload: ( () => void ) | null;
	onerror: ( () => void ) | null;
	onabort: ( () => void ) | null;
	status: number;
	responseText: string;
	withCredentials: boolean;

	constructor() {
		this.upload = { onprogress: null };
		this.onload = null;
		this.onerror = null;
		this.onabort = null;
		this.status = 200;
		this.responseText = '';
		this.withCredentials = false;
		mockXhrInstance = this;
	}

	open = jest.fn();
	send = jest.fn();
	abort = jest.fn();
	setRequestHeader = jest.fn();
}

const OriginalXHR = globalThis.XMLHttpRequest;

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
		mockXhrInstance = null;
		( globalThis as any ).XMLHttpRequest = MockXMLHttpRequest;
	} );

	afterEach( () => {
		jest.clearAllMocks();
		( globalThis as any ).XMLHttpRequest = OriginalXHR;
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

		mockXhrInstance.status = 200;
		mockXhrInstance.responseText = makeResponse();
		mockXhrInstance.onload();

		await promise;

		expect( mockXhrInstance.open ).toHaveBeenCalledWith(
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

		mockXhrInstance.upload.onprogress( {
			lengthComputable: true,
			loaded: 75,
			total: 100,
		} );

		mockXhrInstance.status = 200;
		mockXhrInstance.responseText = makeResponse();
		mockXhrInstance.onload();

		await promise;

		expect( onProgress ).toHaveBeenCalledWith( 75 );
	} );

	it( 'should resolve with transformed attachment on success', async () => {
		const onProgress = jest.fn();
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );

		const promise = sideloadToServer( file, 42, {}, undefined, onProgress );

		mockXhrInstance.status = 200;
		mockXhrInstance.responseText = makeResponse( 99 );
		mockXhrInstance.onload();

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

		mockXhrInstance.onerror();

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

		mockXhrInstance.status = 403;
		mockXhrInstance.responseText = 'Forbidden';
		mockXhrInstance.onload();

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
		expect( mockXhrInstance ).toBeNull();
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
		expect( mockXhrInstance.abort ).toHaveBeenCalled();

		mockXhrInstance.onabort();

		await expect( promise ).rejects.toThrow( 'Aborted' );
	} );
} );
