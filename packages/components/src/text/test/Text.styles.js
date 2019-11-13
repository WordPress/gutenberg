/**
 * External dependencies
 */
import { mount } from 'enzyme';
/**
 * Internal dependencies
 */
import { Text } from '../Text.styles';

const variants = [ 'title.large', 'title.medium', 'title.small', 'subtitle', 'subtitle.small', 'body', 'body.small', 'button', 'caption', 'label' ];

describe( 'Text', () => {
	variants.forEach( ( variant ) => {
		// FIXME: replace with visual regression test
		test( `looks like a "${ variant }"`, () => {
			const element = mount( <Text variant={ variant }>Hello World!</Text> );
			expect( element ).toMatchSnapshot();
		} );
	} );
} );
