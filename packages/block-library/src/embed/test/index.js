/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { getEmbedEditComponent } from '../edit';
import { findBlock } from '../util';

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
} );
