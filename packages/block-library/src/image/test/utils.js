/**
 * Internal dependencies
 */
import {
	getImageBlockMetadataFromAttachment,
	getSyncedImageBlockAttributes,
} from '../utils';

describe( 'core/image utils', () => {
	describe( 'getImageBlockMetadataFromAttachment', () => {
		it( 'normalizes attachment metadata to image block attributes', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					alt_text: 'Alt text',
					caption: { raw: 'First line\nSecond line' },
				} )
			).toEqual( {
				alt: 'Alt text',
				caption: 'First line<br>Second line',
			} );
		} );

		it( 'does not use rendered captions when raw captions are unavailable', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					alt_text: 'Alt text',
					caption: { rendered: '<p>Rendered caption</p>\n' },
				} )
			).toEqual( {
				alt: 'Alt text',
				caption: undefined,
			} );
		} );

		it( 'preserves paragraph markup in raw captions', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: { raw: '<p>Raw caption</p>' },
				} ).caption
			).toBe( '<p>Raw caption</p>' );
		} );

		it( 'does not fall back to rendered captions when raw captions are empty', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: {
						raw: '',
						rendered: '<p>Rendered caption</p>\n',
					},
				} ).caption
			).toBe( '' );
		} );

		it( 'returns an unknown caption when only rendered empty caption markup is available', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: {
						rendered: '<p class="attachment"><br></p>\n',
					},
				} ).caption
			).toBe( undefined );
		} );
	} );

	describe( 'getSyncedImageBlockAttributes', () => {
		it( 'syncs updated attachment metadata when block metadata was not customized', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: 'Original alt',
						caption: 'Original caption',
					},
					{
						alt_text: 'Original alt',
						caption: { raw: 'Original caption' },
					},
					{
						alt_text: 'Updated alt',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {
				alt: 'Updated alt',
				caption: 'Updated caption',
			} );
		} );

		it( 'does not overwrite custom block alt text', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: 'Custom alt',
						caption: 'Original caption',
					},
					{
						alt_text: 'Original alt',
						caption: { raw: 'Original caption' },
					},
					{
						alt_text: 'Updated alt',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {
				caption: 'Updated caption',
			} );
		} );

		it( 'does not overwrite custom block captions', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: 'Original alt',
						caption: 'Custom caption',
					},
					{
						alt_text: 'Original alt',
						caption: { raw: 'Original caption' },
					},
					{
						alt_text: 'Updated alt',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {
				alt: 'Updated alt',
			} );
		} );

		it( 'syncs newly added attachment metadata when original metadata was empty', () => {
			expect(
				getSyncedImageBlockAttributes(
					{},
					{
						alt_text: '',
						caption: { raw: '' },
					},
					{
						alt_text: 'Updated alt',
						caption: { raw: 'Updated\ncaption' },
					}
				)
			).toEqual( {
				alt: 'Updated alt',
				caption: 'Updated<br>caption',
			} );
		} );

		it( 'does not sync captions when the original raw attachment caption is unavailable', () => {
			expect(
				getSyncedImageBlockAttributes(
					{},
					{
						caption: {
							rendered: '<p>Original caption</p>\n',
						},
					},
					{
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {} );
		} );

		it( 'syncs caption to a block with no caption when the original attachment has one', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: '',
						caption: '',
					},
					{
						alt_text: '',
						caption: { raw: 'Existing caption' },
					},
					{
						alt_text: '',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {
				caption: 'Updated caption',
			} );
		} );

		it( 'does not sync caption when block has a custom value differing from the original', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: '',
						caption: 'Custom caption',
					},
					{
						alt_text: '',
						caption: { raw: 'Original caption' },
					},
					{
						alt_text: '',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {} );
		} );

		it( 'clears captions when the updated attachment caption is empty', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						caption: 'Original caption',
					},
					{
						caption: { raw: 'Original caption' },
					},
					{
						caption: { raw: '' },
					}
				)
			).toEqual( {
				caption: undefined,
			} );
		} );

		it( 'does not sync when the original attachment metadata is unknown', () => {
			expect(
				getSyncedImageBlockAttributes(
					{
						alt: '',
						caption: '',
					},
					undefined,
					{
						alt_text: 'Updated alt',
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {} );
		} );
	} );
} );
