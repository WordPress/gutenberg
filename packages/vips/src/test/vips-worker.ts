// Define mock instance that will be shared
const mockWorkerInstance = {
	convertImageFormat: jest.fn(),
	compressImage: jest.fn(),
	resizeImage: jest.fn(),
	hasTransparency: jest.fn(),
	cancelOperations: jest.fn(),
};

// Must use doMock to avoid hoisting issues
jest.doMock( '@shopify/web-worker', () => ( {
	createWorkerFactory: jest.fn( () => jest.fn( () => mockWorkerInstance ) ),
	terminate: jest.fn(),
} ) );

// Mock the worker module path that babel transforms to
jest.doMock( '../worker', () => ( {} ), { virtual: true } );

describe( 'vips-worker', () => {
	// Import modules after mocks are set up
	let vipsConvertImageFormat: typeof import('../vips-worker').vipsConvertImageFormat;
	let vipsCompressImage: typeof import('../vips-worker').vipsCompressImage;
	let vipsResizeImage: typeof import('../vips-worker').vipsResizeImage;
	let vipsHasTransparency: typeof import('../vips-worker').vipsHasTransparency;
	let vipsCancelOperations: typeof import('../vips-worker').vipsCancelOperations;
	let terminateVipsWorker: typeof import('../vips-worker').terminateVipsWorker;
	let createWorkerFactory: jest.Mock;
	let terminate: jest.Mock;

	beforeAll( async () => {
		const vipsWorkerModule = await import( '../vips-worker' );
		vipsConvertImageFormat = vipsWorkerModule.vipsConvertImageFormat;
		vipsCompressImage = vipsWorkerModule.vipsCompressImage;
		vipsResizeImage = vipsWorkerModule.vipsResizeImage;
		vipsHasTransparency = vipsWorkerModule.vipsHasTransparency;
		vipsCancelOperations = vipsWorkerModule.vipsCancelOperations;
		terminateVipsWorker = vipsWorkerModule.terminateVipsWorker;

		const webWorker = await import( '@shopify/web-worker' );
		createWorkerFactory = webWorker.createWorkerFactory as jest.Mock;
		terminate = webWorker.terminate as jest.Mock;
	} );

	it( 'exports all worker functions', () => {
		expect( typeof vipsConvertImageFormat ).toBe( 'function' );
		expect( typeof vipsCompressImage ).toBe( 'function' );
		expect( typeof vipsResizeImage ).toBe( 'function' );
		expect( typeof vipsHasTransparency ).toBe( 'function' );
		expect( typeof vipsCancelOperations ).toBe( 'function' );
		expect( typeof terminateVipsWorker ).toBe( 'function' );
	} );

	it( 'initializes createWorkerFactory on module load', () => {
		// createWorkerFactory should have been called once when the module was loaded
		// Note: The argument type varies based on babel transformation
		expect( createWorkerFactory ).toHaveBeenCalledTimes( 1 );
	} );

	// Clear mocks after factory initialization tests
	beforeEach( () => {
		mockWorkerInstance.convertImageFormat.mockClear();
		mockWorkerInstance.compressImage.mockClear();
		mockWorkerInstance.resizeImage.mockClear();
		mockWorkerInstance.hasTransparency.mockClear();
		mockWorkerInstance.cancelOperations.mockClear();
	} );

	it( 'creates worker instance and delegates vipsConvertImageFormat call', async () => {
		const buffer = new ArrayBuffer( 8 );
		mockWorkerInstance.convertImageFormat.mockResolvedValue( buffer );

		await vipsConvertImageFormat(
			'test-id',
			buffer,
			'image/png',
			'image/jpeg',
			0.9,
			true
		);

		expect( mockWorkerInstance.convertImageFormat ).toHaveBeenCalledWith(
			'test-id',
			buffer,
			'image/png',
			'image/jpeg',
			0.9,
			true
		);
	} );

	it( 'creates worker instance and delegates vipsCompressImage call', async () => {
		const buffer = new ArrayBuffer( 8 );
		mockWorkerInstance.compressImage.mockResolvedValue( buffer );

		await vipsCompressImage( 'test-id', buffer, 'image/jpeg', 0.8, false );

		expect( mockWorkerInstance.compressImage ).toHaveBeenCalledWith(
			'test-id',
			buffer,
			'image/jpeg',
			0.8,
			false
		);
	} );

	it( 'creates worker instance and delegates vipsResizeImage call', async () => {
		const buffer = new ArrayBuffer( 8 );
		const resize = { width: 100, height: 100 };
		mockWorkerInstance.resizeImage.mockResolvedValue( {
			buffer,
			width: 100,
			height: 100,
			originalWidth: 200,
			originalHeight: 200,
		} );

		await vipsResizeImage( 'test-id', buffer, 'image/jpeg', resize, true );

		expect( mockWorkerInstance.resizeImage ).toHaveBeenCalledWith(
			'test-id',
			buffer,
			'image/jpeg',
			resize,
			true
		);
	} );

	it( 'creates worker instance and delegates vipsHasTransparency call', async () => {
		const buffer = new ArrayBuffer( 8 );
		mockWorkerInstance.hasTransparency.mockResolvedValue( true );

		const result = await vipsHasTransparency( buffer );

		expect( mockWorkerInstance.hasTransparency ).toHaveBeenCalledWith(
			buffer
		);
		expect( result ).toBe( true );
	} );

	it( 'creates worker instance and delegates vipsCancelOperations call', async () => {
		mockWorkerInstance.cancelOperations.mockResolvedValue( true );

		const result = await vipsCancelOperations( 'test-id' );

		expect( mockWorkerInstance.cancelOperations ).toHaveBeenCalledWith(
			'test-id'
		);
		expect( result ).toBe( true );
	} );

	it( 'terminates worker when terminateVipsWorker is called', () => {
		terminateVipsWorker();
		expect( terminate ).toHaveBeenCalled();
	} );
} );
