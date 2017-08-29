/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostSticky } from '../';

describe( 'PostSticky', () => {
	const user = {
		data: {
			capabilities: {
				edit_others_posts: true,
				publish_posts: true,
			},
		},
	};

	it( 'should not render anything if the post type is not "post"', () => {
		const wrapper = shallow( <PostSticky postType="page" user={ user } /> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow( <PostSticky postType="post" user={ {} } /> );
		expect( wrapper.type() ).toBe( null );
		wrapper = shallow( <PostSticky postType="post" user={
			{ data: { capabilities: { edit_others_posts: false, publish_posts: true } } }
		} /> );
		expect( wrapper.type() ).toBe( null );
		wrapper = shallow( <PostSticky postType="post" user={
			{ data: { capabilities: { edit_others_posts: true, publish_posts: false } } }
		} /> );
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow( <PostSticky postType="post" user={ user } /> );
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
