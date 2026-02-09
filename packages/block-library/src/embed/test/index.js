/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	registerBlockVariation,
	unregisterBlockVariation,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	findMoreSuitableBlock,
	getClassNames,
	createUpgradedEmbedBlock,
	getEmbedInfoByProvider,
	removeAspectRatioClasses,
	hasAspectRatioClass,
	hasInlineResponsivePadding,
} from '../util';
import { embedInstagramIcon } from '../icons';
import variations from '../variations';
import metadata from '../block.json';

const { name: DEFAULT_EMBED_BLOCK, attributes } = metadata;

jest.mock( '@wordpress/data/src/components/use-select', () => () => ( {} ) );

describe( 'utils', () => {
	beforeAll( () => {
		registerBlockType( DEFAULT_EMBED_BLOCK, {
			apiVersion: 3,
			title: 'Embed',
			category: 'embed',
			attributes,
			variations,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( DEFAULT_EMBED_BLOCK );
	} );

	describe( 'findMoreSuitableBlock', () => {
		test( 'findMoreSuitableBlock matches a URL to a block name', () => {
			const twitterURL = 'https://twitter.com/notnownikki';
			const youtubeURL = 'https://www.youtube.com/watch?v=bNnfuvC1LlU';
			const unknownURL = 'https://example.com/';

			expect( findMoreSuitableBlock( twitterURL ) ).toEqual(
				expect.objectContaining( { name: 'twitter' } )
			);
			expect( findMoreSuitableBlock( youtubeURL ) ).toEqual(
				expect.objectContaining( { name: 'youtube' } )
			);
			expect( findMoreSuitableBlock( unknownURL ) ).toBeUndefined();
		} );
	} );
	describe( 'getClassNames', () => {
		it( 'should return aspect ratio class names for iframes with width and height', () => {
			const html = '<iframe height="9" width="16"></iframe>';
			const expected = 'wp-embed-aspect-16-9 wp-has-aspect-ratio';
			expect( getClassNames( html ) ).toEqual( expected );
		} );

		it( 'should not return aspect ratio class names if we do not allow responsive', () => {
			const html = '<iframe height="9" width="16"></iframe>';
			const expected = '';
			expect( getClassNames( html, '', false ) ).toEqual( expected );
		} );

		it( 'should preserve existing class names when removing responsive classes', () => {
			const html = '<iframe height="9" width="16"></iframe>';
			const expected = 'lovely';
			expect(
				getClassNames(
					html,
					'lovely wp-embed-aspect-16-9 wp-has-aspect-ratio',
					false
				)
			).toEqual( expected );
		} );

		it( 'should return the same falsy value as passed for existing classes when no new classes are added', () => {
			const html = '<iframe></iframe>';
			const expected = undefined;
			expect( getClassNames( html, undefined, false ) ).toEqual(
				expected
			);
		} );

		it( 'should preserve existing classes and replace aspect ratio related classes with the current embed preview', () => {
			const html = '<iframe height="3" width="4"></iframe>';
			const expected =
				'wp-block-embed wp-embed-aspect-4-3 wp-has-aspect-ratio';
			expect(
				getClassNames(
					html,
					'wp-block-embed wp-embed-aspect-16-9 wp-has-aspect-ratio',
					true
				)
			).toEqual( expected );
		} );

		it( 'should not add aspect ratio classes when HTML already contains responsive wrapper with padding-bottom', () => {
			// Flickr embeds come with their own responsive wrapper
			const html =
				'<div style="padding-bottom: 56.25%;"><iframe width="1024" height="576"></iframe></div>';
			const existingClassNames = 'wp-block-embed';
			// Should not add wp-embed-aspect-16-9 and wp-has-aspect-ratio
			// because the HTML already has responsive styling
			expect( getClassNames( html, existingClassNames, true ) ).toEqual(
				existingClassNames
			);
		} );

		it( 'should not add aspect ratio classes when HTML already contains responsive wrapper with padding-top', () => {
			const html =
				'<div style="padding-top: 56.25%;"><iframe width="1024" height="576"></iframe></div>';
			const existingClassNames = 'wp-block-embed';
			expect( getClassNames( html, existingClassNames, true ) ).toEqual(
				existingClassNames
			);
		} );
	} );
	describe( 'hasInlineResponsivePadding', () => {
		it( 'should return true when HTML contains padding-bottom percentage', () => {
			const html =
				'<div style="padding-bottom: 56.25%;"><iframe></iframe></div>';
			expect( hasInlineResponsivePadding( html ) ).toBe( true );
		} );

		it( 'should return true when HTML contains padding-top percentage', () => {
			const html =
				'<div style="padding-top: 75%;"><iframe></iframe></div>';
			expect( hasInlineResponsivePadding( html ) ).toBe( true );
		} );

		it( 'should return false when HTML has no padding percentage', () => {
			const html = '<iframe width="640" height="360"></iframe>';
			expect( hasInlineResponsivePadding( html ) ).toBe( false );
		} );

		it( 'should return false when padding uses pixels instead of percentage', () => {
			const html =
				'<div style="padding-bottom: 20px;"><iframe></iframe></div>';
			expect( hasInlineResponsivePadding( html ) ).toBe( false );
		} );
	} );

	describe( 'hasAspectRatioClass', () => {
		it( 'should return false if an aspect ratio class does not exist', () => {
			const existingClassNames = 'wp-block-embed is-type-video';
			expect( hasAspectRatioClass( existingClassNames ) ).toBe( false );
		} );
		it( 'should return true if an aspect ratio class exists', () => {
			const existingClassNames =
				'wp-block-embed is-type-video wp-embed-aspect-16-9 wp-has-aspect-ratio';
			expect( hasAspectRatioClass( existingClassNames ) ).toBe( true );
		} );
	} );
	describe( 'removeAspectRatioClasses', () => {
		it( 'should return the same falsy value as received', () => {
			const existingClassNames = undefined;
			expect( removeAspectRatioClasses( existingClassNames ) ).toEqual(
				existingClassNames
			);
		} );
		it( 'should preserve existing classes, if no aspect ratio classes exist', () => {
			const existingClassNames = 'wp-block-embed is-type-video';
			expect( removeAspectRatioClasses( existingClassNames ) ).toEqual(
				existingClassNames
			);
		} );
		it( 'should remove the aspect ratio classes', () => {
			const existingClassNames =
				'wp-block-embed is-type-video wp-embed-aspect-16-9 wp-has-aspect-ratio';
			expect( removeAspectRatioClasses( existingClassNames ) ).toEqual(
				'wp-block-embed is-type-video'
			);
		} );
	} );
	describe( 'createUpgradedEmbedBlock', () => {
		describe( 'do not create new block', () => {
			it( 'when block type does not exist', () => {
				const youtubeURL = 'https://www.youtube.com/watch?v=dQw4w';

				unregisterBlockType( DEFAULT_EMBED_BLOCK );

				expect(
					createUpgradedEmbedBlock( {
						attributes: { url: youtubeURL },
					} )
				).toBeUndefined();

				registerBlockType( DEFAULT_EMBED_BLOCK, {
					apiVersion: 3,
					title: 'Embed',
					category: 'embed',
					attributes,
					variations,
				} );
			} );

			it( 'when block variation does not exist', () => {
				const youtubeURL = 'https://www.youtube.com/watch?v=dQw4w';

				unregisterBlockVariation( DEFAULT_EMBED_BLOCK, 'youtube' );

				expect(
					createUpgradedEmbedBlock( {
						attributes: { url: youtubeURL },
					} )
				).toBeUndefined();

				registerBlockVariation(
					DEFAULT_EMBED_BLOCK,
					variations.find( ( { name } ) => name === 'youtube' )
				);
			} );
			it( 'when no url provided', () => {
				expect(
					createUpgradedEmbedBlock( { name: 'some name' } )
				).toBeUndefined();
			} );
		} );

		it( 'should return a YouTube embed block when given a YouTube URL', () => {
			const youtubeURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

			const result = createUpgradedEmbedBlock( {
				attributes: { url: youtubeURL },
			} );

			expect( result ).toEqual(
				expect.objectContaining( {
					name: DEFAULT_EMBED_BLOCK,
					attributes: expect.objectContaining( {
						providerNameSlug: 'youtube',
					} ),
				} )
			);
		} );
	} );
	describe( 'getEmbedInfoByProvider', () => {
		it( 'should return embed info from existent variation', () => {
			expect( getEmbedInfoByProvider( 'instagram' ) ).toEqual(
				expect.objectContaining( {
					icon: embedInstagramIcon,
					title: 'Instagram Embed',
				} )
			);
		} );
		it( 'should return undefined if not found in variations', () => {
			expect(
				getEmbedInfoByProvider( 'i do not exist' )
			).toBeUndefined();
		} );
	} );
} );
