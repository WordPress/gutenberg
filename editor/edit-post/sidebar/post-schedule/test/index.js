/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostSchedule } from '../';

describe( 'PostSchedule', () => {
	const user = {
		data: {
			capabilities: {
				publish_posts: true,
			},
		},
	};

	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow( <PostSchedule user={ {} } /> );
		expect( wrapper.type() ).toBe( null );
		wrapper = shallow( <PostSchedule user={
			{ data: { capabilities: { publish_posts: false } } }
		} /> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow( <PostSchedule user={ user } /> );
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
