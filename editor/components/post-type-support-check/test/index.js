/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostTypeSupportCheck } from '../index';

describe( 'PostTypeSupportCheck', () => {
	it( 'should not render if there\'s no support check provided', () => {
		const wrapper = shallow( <PostTypeSupportCheck>foobar</PostTypeSupportCheck> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if both thumbnail and post-thumbnails are supported', () => {
		const themeSupports = {
			'post-thumbnails': true,
		};
		const postType = {
			supports: {
				thumbnail: true,
			},
		};
		const supportKeys = 'thumbnail';
		const wrapper = shallow( <PostTypeSupportCheck
			supportKeys={ supportKeys }
			postType={ postType }
			themeSupports={ themeSupports }>foobar</PostTypeSupportCheck> );
		expect( wrapper.type() ).not.toBe( null );
	} );

	it( 'should not render if theme doesn\'t support thumbnails', () => {
		const themeSupports = {
			'post-thumbnails': false,
		};
		const postType = {
			supports: {
				thumbnail: true,
			},
		};
		const supportKeys = 'thumbnail';
		const wrapper = shallow( <PostTypeSupportCheck
			supportKeys={ supportKeys }
			postType={ postType }
			themeSupports={ themeSupports }>foobar</PostTypeSupportCheck> );
		expect( wrapper.type() ).toBe( null );
	} );
} );
