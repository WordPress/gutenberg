/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import PostSlugCheck from '../check';

describe( 'PostSlugCheck', () => {
	it( 'should render control', () => {
		const wrapper = shallow( <PostSlugCheck>slug</PostSlugCheck> );

		expect( wrapper.type() ).not.toBe( null );
	} );
} );
