/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { findBlock, createUpgradedEmbedBlock } from '../util';

describe( 'core/embed', () => {
	test( 'findBlock matches a URL to a block name', () => {
		const twitterURL = 'https://twitter.com/notnownikki';
		const youtubeURL = 'https://www.youtube.com/watch?v=bNnfuvC1LlU';
		const unknownURL = 'https://example.com/';

		expect( findBlock( twitterURL ) ).toEqual( 'core-embed/twitter' );
		expect( findBlock( youtubeURL ) ).toEqual( 'core-embed/youtube' );
		expect( findBlock( unknownURL ) ).toEqual( 'core/embed' );
	} );

	test( 'createUpgradedEmbedBlock bails early when block type does not exist', () => {
		const youtubeURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		expect(
			createUpgradedEmbedBlock( { attributes: { url: youtubeURL } }, {} )
		).toBeUndefined();
	} );

	test( 'createUpgradedEmbedBlock returns a YouTube embed block when given a YouTube URL', () => {
		const youtubeURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		registerBlockType( 'core-embed/youtube', {
			title: 'YouTube',
			category: 'embed',
		} );

		const result = createUpgradedEmbedBlock(
			{ attributes: { url: youtubeURL } },
			{}
		);

		unregisterBlockType( 'core-embed/youtube' );

		expect( result ).not.toBeUndefined();
		expect( result.name ).toBe( 'core-embed/youtube' );
	} );
} );
