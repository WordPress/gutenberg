/**
 * Internal dependencies
 */
import { getHeicExifOrientationModifiers } from '../use-save-media-editor';

describe( 'getHeicExifOrientationModifiers', () => {
	it( 'returns the attachment EXIF orientation modifier for Mobile Safari HEIC uploads', () => {
		expect(
			getHeicExifOrientationModifiers(
				{
					exif_orientation: 6,
					media_details: {
						source_image: 'photo.HEIC',
					},
				},
				true
			)
		).toEqual( [ { type: 'rotate', args: { angle: 90 } } ] );
	} );

	it( 'does not apply outside Mobile Safari', () => {
		expect(
			getHeicExifOrientationModifiers(
				{
					exif_orientation: 6,
					media_details: {
						source_image: 'photo.heic',
					},
				},
				false
			)
		).toEqual( [] );
	} );

	it( 'does not apply to non-HEIC source images', () => {
		expect(
			getHeicExifOrientationModifiers(
				{
					exif_orientation: 6,
					media_details: {
						source_image: 'photo.jpg',
					},
				},
				true
			)
		).toEqual( [] );
	} );

	it( 'ignores missing or normal EXIF orientation', () => {
		expect(
			getHeicExifOrientationModifiers(
				{
					exif_orientation: 1,
					media_details: {
						source_image: 'photo.heif',
					},
				},
				true
			)
		).toEqual( [] );
		expect(
			getHeicExifOrientationModifiers(
				{
					media_details: {
						source_image: 'photo.heif',
					},
				},
				true
			)
		).toEqual( [] );
	} );
} );
