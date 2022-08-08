/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostSlug } from '../';

describe( 'PostSlug', () => {
	describe( '#render()', () => {
		it( 'should update internal slug', () => {
			const wrapper = shallow( <PostSlug postSlug="index" /> );

			wrapper.find( TextControl ).prop( 'onChange' )( 'single' );

			expect( wrapper.state().editedSlug ).toEqual( 'single' );
		} );

		it( 'should update slug', () => {
			const onUpdateSlug = jest.fn();
			const wrapper = shallow(
				<PostSlug postSlug="index" onUpdateSlug={ onUpdateSlug } />
			);

			wrapper.find( TextControl ).prop( 'onBlur' )( {
				target: {
					value: 'single',
				},
			} );

			expect( onUpdateSlug ).toHaveBeenCalledWith( 'single' );
		} );
	} );
} );
