import { rotateImage } from '../';

/**
 * Records the chain of vips operations applied to a mock image.
 *
 * Each transform method appends its own name to the shared `calls` array and
 * returns the same image instance so chained calls (e.g. `flipHor().rot90()`)
 * are captured in order.
 */
let calls: string[];
let removed: string[];

/*
 * Controls the `palette` metadata field reported by the mocked source image,
 * which libvips sets for indexed sources. `undefined` means the field is
 * absent, matching a truecolour source.
 */
let mockPalette: number | undefined;

const mockWriteToBuffer = jest.fn( () => ( {
	buffer: new ArrayBuffer( 0 ),
} ) );

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	onProgress = () => {};
	kill = false;

	flipHor = jest.fn( () => {
		calls.push( 'flipHor' );
		return this;
	} );
	flipVer = jest.fn( () => {
		calls.push( 'flipVer' );
		return this;
	} );
	rot90 = jest.fn( () => {
		calls.push( 'rot90' );
		return this;
	} );
	rot180 = jest.fn( () => {
		calls.push( 'rot180' );
		return this;
	} );
	rot270 = jest.fn( () => {
		calls.push( 'rot270' );
		return this;
	} );
	remove = jest.fn( ( field: string ) => {
		removed.push( field );
		return true;
	} );
	writeToBuffer = mockWriteToBuffer;
	/*
	 * Mirrors libvips: reading a field the image does not carry throws rather
	 * than returning a falsy default.
	 */
	getInt = jest.fn( ( name: string ) => {
		if ( 'palette' === name && undefined !== mockPalette ) {
			return mockPalette;
		}
		throw new Error( `${ name }: no such field` );
	} );
}

class MockVipsImage {
	static newFromBuffer = jest.fn( () => new MockImage() );
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: jest.fn(),
		},
	} ) )
);

describe( 'rotateImage', () => {
	beforeEach( () => {
		calls = [];
		removed = [];
		mockPalette = undefined;
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	async function rotate( orientation: number ) {
		const file = new File( [ '<BLOB>' ], 'example.avif', {
			type: 'image/avif',
		} );
		const buffer = await file.arrayBuffer();
		await rotateImage( 'itemId', buffer, 'image/avif', orientation );
	}

	// The expected vips operation chain for each EXIF orientation. The
	// transforms must match the canonical EXIF orientation matrix; in
	// particular orientations 5 and 7 mirror *before* rotating, so the
	// operand order is significant.
	it.each< [ number, string[] ] >( [
		[ 1, [] ],
		[ 2, [ 'flipHor' ] ],
		[ 3, [ 'rot180' ] ],
		[ 4, [ 'flipVer' ] ],
		[ 5, [ 'flipHor', 'rot270' ] ], // Transpose.
		[ 6, [ 'rot90' ] ],
		[ 7, [ 'flipHor', 'rot90' ] ], // Transverse.
		[ 8, [ 'rot270' ] ],
	] )(
		'applies the correct transform chain for orientation %i',
		async ( orientation, expected ) => {
			await rotate( orientation );

			expect( calls ).toEqual( expected );
		}
	);

	it( 'strips the EXIF orientation tag after rotating', async () => {
		await rotate( 6 );

		expect( removed ).toContain( 'orientation' );
	} );

	describe( 'indexed (palette) PNG', () => {
		/*
		 * Rotating is the third path that writes a PNG, alongside resizing and
		 * converting. libvips decodes an indexed PNG into RGB(A) pixels, so
		 * without asking pngsave to quantise back down a rotated PNG is
		 * rewritten as truecolour and inflates - here on the full-size file
		 * rather than a sub-size.
		 * See https://github.com/WordPress/gutenberg/issues/81895.
		 */
		async function rotatePng( orientation: number ) {
			const file = new File( [ '<BLOB>' ], 'example.png', {
				type: 'image/png',
			} );
			const buffer = await file.arrayBuffer();
			await rotateImage( 'itemId', buffer, 'image/png', orientation );
		}

		it( 'quantises a rotated indexed PNG back to a palette', async () => {
			mockPalette = 1;

			await rotatePng( 6 );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.objectContaining( { palette: true } )
			);
		} );

		it( 'leaves a rotated truecolour PNG unquantised', async () => {
			mockPalette = 0;

			await rotatePng( 6 );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );

		it( 'leaves a rotated PNG carrying no palette metadata unquantised', async () => {
			mockPalette = undefined;

			await rotatePng( 6 );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );

		it( 'does not quantise a rotated non-PNG', async () => {
			// A GIF is indexed too, but only pngsave takes `palette`.
			mockPalette = 1;
			const file = new File( [ '<BLOB>' ], 'example.gif', {
				type: 'image/gif',
			} );
			const buffer = await file.arrayBuffer();

			await rotateImage( 'itemId', buffer, 'image/gif', 6 );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );
	} );
} );
