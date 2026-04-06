// Mock @wordpress/data.
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	resolveSelect: jest.fn(),
} ) );

// Mock @wordpress/core-data.
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

const mockConfig = {
	coreUrl: 'https://example.com/ffmpeg-core.js',
	wasmUrl: 'https://example.com/ffmpeg-core.wasm',
};

/**
 * Helper to get a fresh module along with its mock dependencies.
 *
 * After jest.resetModules(), the re-required ffmpeg-plugin gets fresh
 * copies of @wordpress/data, so we must get references to the same
 * mock instances the module is using.
 */
function loadFreshModule() {
	jest.resetModules();
	const { ensureFFmpegAvailable } = require( '../store/utils/ffmpeg-plugin' );
	const { dispatch, resolveSelect } = require( '@wordpress/data' );
	return { ensureFFmpegAvailable, dispatch, resolveSelect };
}

describe( 'ensureFFmpegAvailable', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		// Clear window.__ffmpegWasmConfig.
		delete ( window as unknown as Record< string, unknown > )
			.__ffmpegWasmConfig;

		// Clear wpApiSettings.
		delete ( window as unknown as Record< string, unknown > ).wpApiSettings;
	} );

	it( 'should return config when plugin is already active', async () => {
		( window as unknown as Record< string, unknown > ).__ffmpegWasmConfig =
			mockConfig;

		const { ensureFFmpegAvailable, resolveSelect } = loadFreshModule();

		const result = await ensureFFmpegAvailable();
		expect( result ).toEqual( mockConfig );
		expect( resolveSelect ).not.toHaveBeenCalled();
	} );

	it( 'should return null when user cannot install plugins', async () => {
		const { ensureFFmpegAvailable, resolveSelect } = loadFreshModule();

		const mockCanUser = jest.fn().mockResolvedValue( false );
		resolveSelect.mockReturnValue( { canUser: mockCanUser } );

		const result = await ensureFFmpegAvailable();
		expect( result ).toBeNull();
		expect( mockCanUser ).toHaveBeenCalledWith( 'create', {
			kind: 'root',
			name: 'plugin',
		} );
	} );

	it( 'should install plugin and fetch config when user can install', async () => {
		const { ensureFFmpegAvailable, dispatch, resolveSelect } =
			loadFreshModule();

		resolveSelect.mockReturnValue( {
			canUser: jest.fn().mockResolvedValue( true ),
		} );

		const mockSaveEntityRecord = jest.fn().mockResolvedValue( {} );
		dispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
		} );

		( window as unknown as Record< string, unknown > ).wpApiSettings = {
			root: '/wp-json/',
			nonce: 'test-nonce',
		};
		window.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			json: () => Promise.resolve( mockConfig ),
		} );

		const result = await ensureFFmpegAvailable();
		expect( result ).toEqual( mockConfig );
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'root',
			'plugin',
			{ slug: 'wp-ffmpeg-wasm', status: 'active' },
			{ throwOnError: true }
		);
	} );

	it( 'should return null when plugin installation fails', async () => {
		const { ensureFFmpegAvailable, dispatch, resolveSelect } =
			loadFreshModule();

		resolveSelect.mockReturnValue( {
			canUser: jest.fn().mockResolvedValue( true ),
		} );
		dispatch.mockReturnValue( {
			saveEntityRecord: jest
				.fn()
				.mockRejectedValue( new Error( 'Install failed' ) ),
		} );

		const result = await ensureFFmpegAvailable();
		expect( result ).toBeNull();
	} );

	it( 'should return null when REST config fetch fails', async () => {
		const { ensureFFmpegAvailable, dispatch, resolveSelect } =
			loadFreshModule();

		resolveSelect.mockReturnValue( {
			canUser: jest.fn().mockResolvedValue( true ),
		} );
		dispatch.mockReturnValue( {
			saveEntityRecord: jest.fn().mockResolvedValue( {} ),
		} );

		window.fetch = jest.fn().mockResolvedValue( { ok: false } );

		const result = await ensureFFmpegAvailable();
		expect( result ).toBeNull();
	} );

	it( 'should cache the result for subsequent calls', async () => {
		( window as unknown as Record< string, unknown > ).__ffmpegWasmConfig =
			mockConfig;

		const { ensureFFmpegAvailable } = loadFreshModule();

		const result1 = await ensureFFmpegAvailable();
		const result2 = await ensureFFmpegAvailable();

		expect( result1 ).toEqual( mockConfig );
		expect( result2 ).toEqual( mockConfig );
	} );
} );
