/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostScheduleCheck } from '../check';

describe( 'PostScheduleCheck', () => {
	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow( <PostScheduleCheck>yes</PostScheduleCheck> );
		expect( wrapper.type() ).toBe( null );
		wrapper = shallow( <PostScheduleCheck canPublishPosts={ false }>yes</PostScheduleCheck> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow( <PostScheduleCheck canPublishPosts>yes</PostScheduleCheck> );
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
