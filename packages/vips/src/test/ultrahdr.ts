/**
 * Internal dependencies
 */
import { getUltraHdrInfo, resizeImage } from '../';

const mockThumbnailImage = jest.fn();
const mockThumbnailBuffer = jest.fn();
const mockNewFromBuffer = jest.fn();
const mockUhdrLoadBuffer = jest.fn();
const mockUhdrSaveBuffer = jest.fn(
	() => new Uint8Array( [ 0xff, 0xd8, 0xff ] )
);
const mockWriteToBuffer = jest.fn( () => ( { buffer: new ArrayBuffer( 0 ) } ) );
const mockGetDouble = jest.fn();

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	gainmap: MockImage | undefined;
	thumbnailImage = mockThumbnailImage.mockImplementation( () => this );
	uhdrsaveBuffer = mockUhdrSaveBuffer;
	writeToBuffer = mockWriteToBuffer;
	getDouble = mockGetDouble;
	crop = jest.fn( () => this );
}

class MockVipsImage {
	static thumbnailBuffer = mockThumbnailBuffer.mockImplementation(
		() => new MockImage()
	);
	static newFromBuffer = mockNewFromBuffer.mockImplementation(
		() => new MockImage()
	);
	static uhdrloadBuffer = mockUhdrLoadBuffer;
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
	} ) )
);

describe( 'UltraHDR helpers', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getUltraHdrInfo', () => {
		it( 'returns dims + log2 capacity for valid UltraHDR', async () => {
			const image = new MockImage();
			image.width = 1024;
			image.pageHeight = 768;
			// Mark as having a gain map so the helper recognizes it.
			image.gainmap = new MockImage();
			mockGetDouble.mockReturnValueOnce( 8 ); // linear capacity 8 → 3 stops
			mockUhdrLoadBuffer.mockReturnValueOnce( image );

			const buffer = new ArrayBuffer( 16 );
			const result = await getUltraHdrInfo( buffer );

			expect( mockUhdrLoadBuffer ).toHaveBeenCalledWith( buffer );
			expect( mockGetDouble ).toHaveBeenCalledWith(
				'gainmap-hdr-capacity-max'
			);
			expect( result ).toEqual( {
				width: 1024,
				height: 768,
				hdrCapacity: 3,
			} );
		} );

		it( 'returns null when image has no gain map', async () => {
			const image = new MockImage();
			// gainmap stays undefined.
			mockUhdrLoadBuffer.mockReturnValueOnce( image );

			const result = await getUltraHdrInfo( new ArrayBuffer( 16 ) );

			expect( result ).toBeNull();
			expect( mockGetDouble ).not.toHaveBeenCalled();
		} );

		it( 'returns null when uhdrloadBuffer throws', async () => {
			mockUhdrLoadBuffer.mockImplementationOnce( () => {
				throw new Error( 'not an UltraHDR jpeg' );
			} );

			const result = await getUltraHdrInfo( new ArrayBuffer( 16 ) );

			expect( result ).toBeNull();
		} );

		it( 'falls back to zero capacity when metadata missing', async () => {
			const image = new MockImage();
			image.width = 256;
			image.pageHeight = 256;
			image.gainmap = new MockImage();
			mockGetDouble.mockImplementationOnce( () => {
				throw new Error( 'no such field' );
			} );
			mockUhdrLoadBuffer.mockReturnValueOnce( image );

			const result = await getUltraHdrInfo( new ArrayBuffer( 16 ) );

			expect( result ).toEqual( {
				width: 256,
				height: 256,
				hdrCapacity: 0,
			} );
		} );
	} );

	describe( 'resizeImage with isUltraHdr', () => {
		it( 'loads via uhdrloadBuffer and saves via uhdrsaveBuffer when isUltraHdr=true', async () => {
			const image = new MockImage();
			image.width = 1024;
			image.pageHeight = 768;
			image.gainmap = new MockImage();
			mockUhdrLoadBuffer.mockReturnValueOnce( image );

			const buffer = new ArrayBuffer( 16 );
			await resizeImage(
				'itemId',
				buffer,
				'image/jpeg',
				{ width: 200, height: 0 },
				false,
				0.7,
				true
			);

			// Should NOT use the regular load path.
			expect( mockNewFromBuffer ).not.toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();

			// UltraHDR path: uhdrload, then thumbnailImage on the loaded image.
			expect( mockUhdrLoadBuffer ).toHaveBeenCalledWith( buffer );
			expect( mockThumbnailImage ).toHaveBeenCalledWith( 200, {
				size: 'down',
				height: 150,
			} );
			// Saves with quality scaled to 0..100; no `keep` so XMP gain map metadata is preserved.
			expect( mockUhdrSaveBuffer ).toHaveBeenCalledWith( {
				Q: 70,
			} );
		} );

		it( 'uses the regular path when isUltraHdr=false', async () => {
			await resizeImage(
				'itemId',
				new ArrayBuffer( 16 ),
				'image/jpeg',
				{ width: 200, height: 200 },
				false,
				0.82,
				false
			);

			expect( mockUhdrLoadBuffer ).not.toHaveBeenCalled();
			expect( mockUhdrSaveBuffer ).not.toHaveBeenCalled();
			expect( mockNewFromBuffer ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalled();
		} );
	} );
} );
