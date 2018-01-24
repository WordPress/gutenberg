/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostScheduleCheck } from '../check';

describe( 'PostScheduleCheck', () => {
	const user = {
		data: {
			post_type_capabilities: {
				publish_posts: true,
			},
		},
	};

	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow( <PostScheduleCheck user={ {} } >yes</PostScheduleCheck> );
		expect( wrapper.type() ).toBe( null );
		wrapper = shallow( <PostScheduleCheck user={
			{ data: { post_type_capabilities: { publish_posts: false } } }
		}>yes</PostScheduleCheck> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow( <PostScheduleCheck user={ user }>yes</PostScheduleCheck> );
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
