/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Image from '../';

describe( 'Image', () => {
	it( 'renders nothing when src omitted', () => {
		const image = shallow( <Image /> );
		expect( image.type() ).toBeNull();
	} );

	it( 'renders an img tag with src and alt', () => {
		const image = shallow( <Image src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" alt="WordPress logo" /> );
		expect( image.type().displayName ).toBe( 'Image' );
		expect( image.prop( 'source' ) ).toMatchObject( { uri: 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png' } );
		expect( image.prop( 'accessibilityLabel' ) ).toBe( 'WordPress logo' );
	} );

	it( 'renders an img tag passing any additional props', () => {
		const image = shallow( <Image src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" alt="WordPress logo" data-id="123" /> );
		expect( image.type().displayName ).toBe( 'Image' );
		expect( image.prop( 'data-id' ) ).toBe( '123' );
	} );
} );
