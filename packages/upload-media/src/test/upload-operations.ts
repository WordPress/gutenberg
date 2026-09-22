/**
 * The public registration functions, against the store in the default
 * registry, which is the one a plugin reaches.
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
} from 'vitest';
import {
	getUploadOperation,
	getUploadOperations,
	registerUploadConcurrencyPool,
	registerUploadOperation,
	unregisterUploadOperation,
	UploadOperationType,
	type UploadOperationSettings,
} from '..';

vi.mock(
	import( '@wordpress/blob' ),
	() =>
		( {
			createBlobURL: vi.fn( () => 'blob:foo' ),
			isBlobURL: vi.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
			revokeBlobURL: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/blob' )
);

const settings: UploadOperationSettings = {
	label: 'Reading text',
	handler: () => {},
};

describe( 'upload operations', () => {
	let consoleError: MockInstance;

	beforeEach( () => {
		consoleError = vi
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
	} );

	afterEach( () => {
		consoleError.mockRestore();
		for ( const { name } of getUploadOperations() ) {
			if ( name.startsWith( 'my-plugin/' ) ) {
				unregisterUploadOperation( name );
			}
		}
	} );

	describe( 'registerUploadOperation', () => {
		it( 'registers an operation under the given name and returns it', () => {
			const operation = registerUploadOperation(
				'my-plugin/ocr',
				settings
			);

			expect( operation ).toEqual( {
				...settings,
				name: 'my-plugin/ocr',
			} );
			expect( getUploadOperation( 'my-plugin/ocr' ) ).toBe( operation );
			expect( getUploadOperations() ).toContain( operation );
		} );

		it( 'takes the name from the argument, not the settings', () => {
			const operation = registerUploadOperation( 'my-plugin/ocr', {
				...settings,
				name: 'my-plugin/other',
			} as UploadOperationSettings );

			expect( operation?.name ).toBe( 'my-plugin/ocr' );
			expect( getUploadOperation( 'my-plugin/other' ) ).toBeUndefined();
		} );

		it( 'returns undefined and reports a rejected registration', () => {
			expect(
				registerUploadOperation( 'ocr', settings )
			).toBeUndefined();
			expect( getUploadOperation( 'ocr' ) ).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation names must be strings in the form "namespace/operation-name", like "core/upload".'
			);
		} );

		it( 'rejects a name that is already registered', () => {
			registerUploadOperation( 'my-plugin/ocr', settings );

			expect(
				registerUploadOperation( 'my-plugin/ocr', settings )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/ocr" is already registered.'
			);
		} );

		it( 'ships with every core operation registered', () => {
			expect( getUploadOperations().map( ( { name } ) => name ) ).toEqual(
				expect.arrayContaining( Object.values( UploadOperationType ) )
			);
			expect( getUploadOperation( 'core/upload' )?.label ).toBe(
				'Uploading'
			);
		} );
	} );

	describe( 'unregisterUploadOperation', () => {
		it( 'removes an operation and returns it', () => {
			const operation = registerUploadOperation(
				'my-plugin/ocr',
				settings
			);

			expect( unregisterUploadOperation( 'my-plugin/ocr' ) ).toBe(
				operation
			);
			expect( getUploadOperation( 'my-plugin/ocr' ) ).toBeUndefined();
		} );

		it( 'returns undefined for an operation that is not registered', () => {
			expect(
				unregisterUploadOperation( 'my-plugin/missing' )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/missing" is not registered.'
			);
		} );

		it( 'lets a core operation be replaced under its own name', () => {
			const core = getUploadOperation( UploadOperationType.Finalize );
			const replacement: UploadOperationSettings = {
				label: 'Wrapping up',
				handler: () => {},
			};

			expect(
				unregisterUploadOperation( UploadOperationType.Finalize )
			).toBe( core );
			expect(
				registerUploadOperation(
					UploadOperationType.Finalize,
					replacement
				)
			).toEqual( { ...replacement, name: UploadOperationType.Finalize } );

			// Put core's step back for the tests after this one.
			unregisterUploadOperation( UploadOperationType.Finalize );
			registerUploadOperation( UploadOperationType.Finalize, core! );
			expect(
				getUploadOperation( UploadOperationType.Finalize )
			).toEqual( core );
		} );
	} );

	describe( 'registerUploadConcurrencyPool', () => {
		it( 'registers a pool an operation can then join', () => {
			expect(
				registerUploadConcurrencyPool( 'my-plugin/ocr', { limit: 2 } )
			).toEqual( { name: 'my-plugin/ocr', limit: 2 } );
			expect(
				registerUploadOperation( 'my-plugin/ocr', {
					...settings,
					concurrency: 'my-plugin/ocr',
				} )
			).toBeDefined();
		} );

		it( 'rejects an operation joining a pool that is not registered', () => {
			expect(
				registerUploadOperation( 'my-plugin/ocr', {
					...settings,
					concurrency: 'my-plugin/missing',
				} )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/ocr" joins the concurrency pool "my-plugin/missing", which is not registered.'
			);
		} );

		it( 'rejects a limit that would not limit anything', () => {
			expect(
				registerUploadConcurrencyPool( 'my-plugin/none', { limit: 0 } )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Concurrency pool "my-plugin/none" must have a "limit" that is a positive number, or a function returning one.'
			);
		} );
	} );
} );
