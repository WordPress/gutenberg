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

		it( 'uses rendered captions when raw captions are unavailable', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					alt_text: 'Alt text',
					caption: { rendered: '<p>Rendered caption</p>\n' },
				} )
			).toEqual( {
				alt: 'Alt text',
				caption: 'Rendered caption',
			} );
		} );

		it( 'preserves paragraph markup in raw captions', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: { raw: '<p>Raw caption</p>' },
				} ).caption
			).toBe( '<p>Raw caption</p>' );
		} );

		it( 'uses rendered captions when raw captions are empty', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: {
						raw: '',
						rendered: '<p>Rendered caption</p>\n',
					},
				} ).caption
			).toBe( 'Rendered caption' );
		} );

		it( 'normalizes empty rendered caption markup to an empty string', () => {
			expect(
				getImageBlockMetadataFromAttachment( {
					caption: {
						raw: '',
						rendered: '<p class="attachment"><br></p>\n',
					},
				} ).caption
			).toBe( '' );
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

		it( 'syncs newly added captions when the original attachment caption is empty rendered markup', () => {
			expect(
				getSyncedImageBlockAttributes(
					{},
					{
						caption: {
							raw: '',
							rendered: '<p class="attachment"><br></p>\n',
						},
					},
					{
						caption: { raw: 'Updated caption' },
					}
				)
			).toEqual( {
				caption: 'Updated caption',
			} );
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
