/**
 * Internal dependencies
 */
import { getUltraHdrInfo, resizeImage } from '../';

const mockThumbnailImage = jest.fn();
const mockThumbnailBuffer = jest.fn();
const mockNewFromBuffer = jest.fn();
const mockUhdrLoadBuffer = jest.fn();
const mockWriteToBuffer = jest.fn( () => ( { buffer: new ArrayBuffer( 0 ) } ) );
const mockGetDouble = jest.fn();
const mockSetImage = jest.fn();
const mockCrop = jest.fn();

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	gainmap: MockImage | undefined;
	thumbnailImage = mockThumbnailImage.mockImplementation( () => this );
	writeToBuffer = mockWriteToBuffer;
	getDouble = mockGetDouble;
	crop = mockCrop.mockImplementation( () => this );
	copy = jest.fn( () => this );
	setImage = mockSetImage;
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
		// getVips() calls Cache.max(0) to disable libvips's operation cache.
		Cache: { max: jest.fn() },
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

	describe( 'resizeImage uses libvips auto-detection for UltraHDR', () => {
		it( 'uses newFromBuffer/thumbnailBuffer/writeToBuffer regardless of UltraHDR status', async () => {
			// libvips auto-detects UltraHDR via uhdrload's higher priority,
			// and writeToBuffer auto-delegates to uhdrsave when a gain map
			// is attached. No separate uhdr code path is needed here.
			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 200,
				height: 200,
			} );

			expect( mockUhdrLoadBuffer ).not.toHaveBeenCalled();
			expect( mockNewFromBuffer ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalled();
		} );

		it( 'passes keep:icc|gainmap to writeToBuffer to preserve gain maps', async () => {
			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 200,
				height: 200,
			} );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'icc|gainmap' } )
			);
		} );

		it( 'crops the gain map alongside the main image on positional crop', async () => {
			// Build a thumbnail with a gain map at half resolution.
			const thumb = new MockImage();
			thumb.width = 200;
			thumb.height = 200;
			thumb.pageHeight = 200;
			const thumbGainmap = new MockImage();
			thumbGainmap.width = 100;
			thumbGainmap.height = 100;
			thumb.gainmap = thumbGainmap;
			mockThumbnailBuffer.mockImplementationOnce( () => thumb );

			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 100,
				height: 100,
				crop: [ 'center', 'top' ],
			} );

			// Main image is cropped at full resolution.
			expect( thumb.crop ).toHaveBeenCalledWith( 50, 0, 100, 100 );
			// Gain map is cropped at its (halved) scale.
			expect( thumbGainmap.crop ).toHaveBeenCalledWith( 25, 0, 50, 50 );
			// Result is set as the gain map on a copy of the cropped image.
			expect( mockSetImage ).toHaveBeenCalledWith(
				'gainmap',
				expect.anything()
			);
		} );

		it( 'preserves the gain map on a simple downscale without manually cropping it', async () => {
			// A proportional downscale (no crop) relies on libvips's
			// `thumbnail` to resize the attached gain map in lockstep, so the
			// resize step must not crop it manually, and `writeToBuffer` must
			// keep the gain map metadata.
			const thumb = new MockImage();
			thumb.width = 300;
			thumb.height = 225;
			thumb.pageHeight = 225;
			thumb.gainmap = new MockImage();
			mockThumbnailBuffer.mockImplementationOnce( () => thumb );

			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 300,
				height: 0,
			} );

			// No positional crop, so neither the image nor its gain map is
			// cropped, and no gain map is re-attached manually.
			expect( thumb.crop ).not.toHaveBeenCalled();
			expect( mockSetImage ).not.toHaveBeenCalled();
			// The gain map still survives via the keep flag on save.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'icc|gainmap' } )
			);
		} );

		it( 'preserves the gain map on a boolean (centre) crop without manually cropping it', async () => {
			// A boolean crop is handled entirely by `thumbnail` (with its
			// crop option), which updates the gain map automatically, so the
			// resize step must not crop the gain map itself.
			const thumb = new MockImage();
			thumb.width = 150;
			thumb.height = 150;
			thumb.pageHeight = 150;
			thumb.gainmap = new MockImage();
			mockThumbnailBuffer.mockImplementationOnce( () => thumb );

			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 150,
				height: 150,
				crop: true,
			} );

			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( thumb.crop ).not.toHaveBeenCalled();
			expect( mockSetImage ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'icc|gainmap' } )
			);
		} );

		it( 'skips gain-map crop when no gain map is present', async () => {
			const thumb = new MockImage();
			thumb.width = 200;
			thumb.height = 200;
			thumb.pageHeight = 200;
			// gainmap stays undefined.
			mockThumbnailBuffer.mockImplementationOnce( () => thumb );

			await resizeImage( 'itemId', new ArrayBuffer( 16 ), 'image/jpeg', {
				width: 100,
				height: 100,
				crop: [ 'center', 'top' ],
			} );

			expect( thumb.crop ).toHaveBeenCalledWith( 50, 0, 100, 100 );
			expect( mockSetImage ).not.toHaveBeenCalled();
		} );
	} );
} );
