/**
 * Internal dependencies
 */
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
	writeToBuffer = jest.fn( () => ( {
		buffer: new ArrayBuffer( 0 ),
	} ) );
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
} );
