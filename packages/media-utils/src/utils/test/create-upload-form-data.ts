/**
 * Internal dependencies
 */
import {
	createUploadFormData,
	createSideloadFormData,
} from '../create-upload-form-data';

describe( 'createUploadFormData', () => {
	it( 'should append file to form data', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const appendSpy = jest.spyOn( FormData.prototype, 'append' );
		createUploadFormData( file );

		expect( appendSpy ).toHaveBeenCalledWith( 'file', file );
		appendSpy.mockRestore();
	} );

	it( 'should use MIME-type fallback when file has no name', () => {
		const file = new File( [ 'content' ], '', {
			type: 'image/jpeg',
		} );
		const appendSpy = jest.spyOn( FormData.prototype, 'append' );
		createUploadFormData( file );

		// When file has no name, a new File with a derived name is created.
		const appendedFile = appendSpy.mock.calls[ 0 ][ 1 ] as File;
		expect( appendedFile.name ).toBe( 'image.jpeg' );
		appendSpy.mockRestore();
	} );

	it( 'should append additional data fields', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const formData = createUploadFormData( file, {
			alt_text: 'A photo',
			status: 'publish',
		} as any );

		expect( formData.get( 'alt_text' ) ).toBe( 'A photo' );
		expect( formData.get( 'status' ) ).toBe( 'publish' );
	} );

	it( 'should flatten nested additional data', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const formData = createUploadFormData( file, {
			meta: { key: 'value' },
		} as any );

		expect( formData.get( 'meta[key]' ) ).toBe( 'value' );
	} );

	it( 'should work with empty additionalData', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const appendSpy = jest.spyOn( FormData.prototype, 'append' );
		createUploadFormData( file, {} );

		// Only the file field should be appended.
		expect( appendSpy ).toHaveBeenCalledTimes( 1 );
		expect( appendSpy ).toHaveBeenCalledWith( 'file', file );
		appendSpy.mockRestore();
	} );
} );

describe( 'createSideloadFormData', () => {
	it( 'should append file for sideloading', () => {
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );
		const appendSpy = jest.spyOn( FormData.prototype, 'append' );
		createSideloadFormData( file );

		expect( appendSpy ).toHaveBeenCalledWith( 'file', file );
		appendSpy.mockRestore();
	} );

	it( 'should append sideload-specific additional data', () => {
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );
		const formData = createSideloadFormData( file, {
			image_size: 'full',
		} );

		expect( formData.get( 'image_size' ) ).toBe( 'full' );
	} );
} );
