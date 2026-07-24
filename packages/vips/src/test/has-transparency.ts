/**
 * Internal dependencies
 */
import { hasTransparency } from '../';

const mockHasAlpha = jest.fn();
const mockExtractBand = jest.fn();
const mockMin = jest.fn();

class MockAlphaBand {
	min = mockMin;
}

class MockImage {
	hasAlpha = mockHasAlpha;
	extractBand = mockExtractBand;
	bands = 4;
	format = 'uchar';
}

const mockNewFromBuffer = jest.fn( () => new MockImage() );

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: {
			newFromBuffer: mockNewFromBuffer,
		},
		Cache: {
			max: jest.fn(),
		},
	} ) )
);

describe( 'hasTransparency', () => {
	beforeEach( () => {
		mockExtractBand.mockReturnValue( new MockAlphaBand() );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns false when the image has no alpha channel', async () => {
		mockHasAlpha.mockReturnValue( false );

		const buffer = new ArrayBuffer( 0 );
		const result = await hasTransparency( buffer );

		expect( result ).toBe( false );
		// Cheap short-circuit: never reaches the per-pixel sampling.
		expect( mockExtractBand ).not.toHaveBeenCalled();
		expect( mockMin ).not.toHaveBeenCalled();
	} );

	it( 'returns false when alpha channel is present but every pixel is opaque (uchar)', async () => {
		// Mirrors the GIF case Andrew reported: an animated GIF that declares
		// a transparent color for its disposal-method frame compositing but
		// renders no visibly transparent pixels.
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 255 );

		const result = await hasTransparency( new ArrayBuffer( 0 ) );

		expect( result ).toBe( false );
		expect( mockExtractBand ).toHaveBeenCalledWith( 3 );
		expect( mockMin ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns true when at least one pixel is partially transparent (uchar)', async () => {
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 128 );

		const result = await hasTransparency( new ArrayBuffer( 0 ) );

		expect( result ).toBe( true );
	} );

	it( 'returns true when at least one pixel is fully transparent (uchar)', async () => {
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 0 );

		const result = await hasTransparency( new ArrayBuffer( 0 ) );

		expect( result ).toBe( true );
	} );

	it( 'uses the 16-bit opaque value for ushort images', async () => {
		// A 16-bit PNG with alpha=65535 across every pixel is fully opaque.
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 65535 );
		mockNewFromBuffer.mockReturnValueOnce(
			Object.assign( new MockImage(), { format: 'ushort' } )
		);

		const result = await hasTransparency( new ArrayBuffer( 0 ) );

		expect( result ).toBe( false );
	} );

	it( 'flags transparency on a ushort image when alpha drops below the 16-bit opaque value', async () => {
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 32768 );
		mockNewFromBuffer.mockReturnValueOnce(
			Object.assign( new MockImage(), { format: 'ushort' } )
		);

		const result = await hasTransparency( new ArrayBuffer( 0 ) );

		expect( result ).toBe( true );
	} );

	it( 'samples the last band as the alpha channel', async () => {
		// Defensive: for an unusual RGBA-with-extra-band image the alpha is
		// still the final band. The check should follow that convention.
		mockHasAlpha.mockReturnValue( true );
		mockMin.mockReturnValue( 255 );
		mockNewFromBuffer.mockReturnValueOnce(
			Object.assign( new MockImage(), { bands: 5 } )
		);

		await hasTransparency( new ArrayBuffer( 0 ) );

		expect( mockExtractBand ).toHaveBeenCalledWith( 4 );
	} );
} );
