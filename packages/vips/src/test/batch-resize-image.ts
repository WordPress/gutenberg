/**
 * Internal dependencies
 */
import {
	batchResizeImage,
	cancelOperations,
	OperationCancelledError,
} from '../';

const mockThumbnailImage = jest.fn( () => new MockImage() );
const mockCopyMemory = jest.fn( () => new MockImage() );
const mockNewFromBuffer = jest.fn( () => new MockImage() );

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	kill = false;
	onProgress: ( () => void ) | undefined;
	thumbnailImage = mockThumbnailImage;
	copyMemory = mockCopyMemory;
	writeToBuffer = jest.fn( () => ( {
		buffer: new ArrayBuffer( 0 ),
	} ) );
}

class MockVipsImage {
	static newFromBuffer = mockNewFromBuffer;
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
	} ) )
);

const buildBuffer = async () => {
	const file = new File( [ '<BLOB>' ], 'example.jpg', {
		lastModified: 1234567891,
		type: 'image/jpeg',
	} );
	return file.arrayBuffer();
};

describe( 'batchResizeImage', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns one result per requested size when not cancelled', async () => {
		const buffer = await buildBuffer();

		const results = await batchResizeImage(
			'itemId',
			buffer,
			'image/jpeg',
			'image/jpeg',
			[
				{ resize: { width: 100, height: 100 }, quality: 0.82 },
				{ resize: { width: 50, height: 50 }, quality: 0.82 },
				{ resize: { width: 25, height: 25 }, quality: 0.82 },
			]
		);

		expect( results ).toHaveLength( 3 );
		expect( mockThumbnailImage ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'throws OperationCancelledError and discards partial results when cancelled mid-batch', async () => {
		const buffer = await buildBuffer();

		// Cancel after the first thumbnail is produced. Each call to
		// thumbnailImage() advances one iteration; on the second call we
		// trigger cancellation so the loop check at the top of the third
		// iteration aborts the batch.
		let calls = 0;
		mockThumbnailImage.mockImplementation( () => {
			calls += 1;
			if ( calls === 2 ) {
				cancelOperations( 'itemId' );
			}
			return new MockImage();
		} );

		await expect(
			batchResizeImage( 'itemId', buffer, 'image/jpeg', 'image/jpeg', [
				{ resize: { width: 100, height: 100 }, quality: 0.82 },
				{ resize: { width: 50, height: 50 }, quality: 0.82 },
				{ resize: { width: 25, height: 25 }, quality: 0.82 },
			] )
		).rejects.toBeInstanceOf( OperationCancelledError );

		// Two iterations executed before cancellation aborted the third.
		expect( mockThumbnailImage ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'throws when cancelled before the first thumbnail', async () => {
		const buffer = await buildBuffer();

		// Pre-cancel: the loop's first iteration check should fire.
		mockNewFromBuffer.mockImplementationOnce( () => {
			cancelOperations( 'itemId' );
			return new MockImage();
		} );

		await expect(
			batchResizeImage( 'itemId', buffer, 'image/jpeg', 'image/jpeg', [
				{ resize: { width: 100, height: 100 }, quality: 0.82 },
				{ resize: { width: 50, height: 50 }, quality: 0.82 },
			] )
		).rejects.toBeInstanceOf( OperationCancelledError );

		expect( mockThumbnailImage ).not.toHaveBeenCalled();
	} );
} );
