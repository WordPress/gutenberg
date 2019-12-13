/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { getEmbedEditComponent } from '../edit';
import { getClassNames } from '../util';

describe( 'core/embed', () => {
	test( 'block edit matches snapshot', () => {
		const EmbedEdit = getEmbedEditComponent( 'Embed', 'embed-generic' );
		const wrapper = render( <EmbedEdit attributes={ {} } /> );

		expect( wrapper ).toMatchSnapshot();
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
} );
