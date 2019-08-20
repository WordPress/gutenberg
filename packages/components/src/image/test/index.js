/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ImageWithForwardedRef, { Image } from '../';

describe( 'Image', () => {
	it( 'renders nothing when src omitted', () => {
		const image = shallow( <Image /> );
		expect( image.type() ).toBeNull();
	} );

	it( 'renders an img tag with src and alt', () => {
		const image = shallow( <Image src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" alt="WordPress logo" /> );
		expect( image.type() ).toBe( 'img' );
		expect( image.prop( 'src' ) ).toBe( 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png' );
		expect( image.prop( 'alt' ) ).toBe( 'WordPress logo' );
	} );

	it( 'renders an img tag passing any additional props', () => {
		const image = shallow( <Image src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" alt="WordPress logo" data-id="123" /> );
		expect( image.type() ).toBe( 'img' );
		expect( image.prop( 'data-id' ) ).toBe( '123' );
	} );

	it( 'should enable access to DOM element', () => {
		const ref = createRef();

		TestUtils.renderIntoDocument( <ImageWithForwardedRef ref={ ref } src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png" alt="WordPress logo" /> );
		expect( ref.current ).toBeDefined();
	} );
} );
