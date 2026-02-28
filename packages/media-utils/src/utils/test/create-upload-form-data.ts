/**
 * Internal dependencies
 */
import {
	createUploadFormData,
	createSideloadFormData,
} from '../create-upload-form-data';

describe( 'createUploadFormData', () => {
	it( 'should append file with correct name', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const formData = createUploadFormData( file );

		expect( formData.get( 'file' ) ).toBeInstanceOf( File );
		const result = formData.get( 'file' ) as File;
		expect( result.name ).toBe( 'photo.jpg' );
	} );

	it( 'should use MIME-type fallback when file has no name', () => {
		const file = new File( [ 'content' ], '', {
			type: 'image/jpeg',
		} );
		const formData = createUploadFormData( file );

		const result = formData.get( 'file' ) as File;
		expect( result.name ).toBe( 'image.jpeg' );
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
		const formData = createUploadFormData( file, {} );

		expect( formData.get( 'file' ) ).toBeInstanceOf( File );
		// Only the file field should be present.
		const keys = Array.from( formData.keys() );
		expect( keys ).toEqual( [ 'file' ] );
	} );
} );

describe( 'createSideloadFormData', () => {
	it( 'should create FormData with file for sideloading', () => {
		const file = new File( [ 'content' ], 'image.webp', {
			type: 'image/webp',
		} );
		const formData = createSideloadFormData( file );

		const result = formData.get( 'file' ) as File;
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'image.webp' );
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
