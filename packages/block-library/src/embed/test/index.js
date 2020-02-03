/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getEmbedEditComponent } from '../edit';
import { findBlock, getClassNames, createUpgradedEmbedBlock } from '../util';

describe( 'core/embed', () => {
	test( 'block edit matches snapshot', () => {
		const EmbedEdit = getEmbedEditComponent( 'Embed', 'embed-generic' );
		const wrapper = render( <EmbedEdit attributes={ {} } /> );

		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'findBlock matches a URL to a block name', () => {
		const twitterURL = 'https://twitter.com/notnownikki';
		const youtubeURL = 'https://www.youtube.com/watch?v=bNnfuvC1LlU';
		const unknownURL = 'https://example.com/';

		expect( findBlock( twitterURL ) ).toEqual( 'core-embed/twitter' );
		expect( findBlock( youtubeURL ) ).toEqual( 'core-embed/youtube' );
		expect( findBlock( unknownURL ) ).toEqual( 'core/embed' );
	} );

	test( 'getClassNames returns aspect ratio class names for iframes with width and height', () => {
		const html = '<iframe height="9" width="16"></iframe>';
		const expected = 'wp-embed-aspect-16-9 wp-has-aspect-ratio';
		expect( getClassNames( html ) ).toEqual( expected );
	} );

	test( 'getClassNames does not return aspect ratio class names if we do not allow responsive', () => {
		const html = '<iframe height="9" width="16"></iframe>';
		const expected = '';
		expect( getClassNames( html, '', false ) ).toEqual( expected );
	} );

	test( 'getClassNames preserves exsiting class names when removing responsive classes', () => {
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
