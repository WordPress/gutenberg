/**
 * External dependencies
 */
import { mount } from 'enzyme';
/**
 * Internal dependencies
 */
import { Text } from '../text.styles';
import { ThemeProvider } from '../../theme';

const variants = [ 'title.large', 'title.medium', 'title.small', 'subtitle', 'subtitle.small', 'body', 'body.small', 'button', 'caption', 'label' ];

describe( 'Text', () => {
	variants.forEach( ( variant ) => {
		// FIXME: replace with visual regression test
		test( `looks like a "${ variant }"`, () => {
			const element = mount( <ThemeProvider><Text variant={ variant }>Hello World!</Text></ThemeProvider> );
			expect( element ).toMatchSnapshot();
		} );
	} );
} );
