/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostStickyCheck } from '../check';

describe( 'PostSticky', () => {
	const user = {
		data: {
			post_type_capabilities: {
				edit_others_posts: true,
				publish_posts: true,
			},
		},
	};

	it( 'should not render anything if the post type is not "post"', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="page" user={ user }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow(
			<PostStickyCheck postType="post" user={ {} }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );

		wrapper = shallow(
			<PostStickyCheck postType="post" user={
				{ data: { post_type_capabilities: { edit_others_posts: false, publish_posts: true } } }
			}>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );

		wrapper = shallow(
			<PostStickyCheck postType="post" user={
				{ data: { post_type_capabilities: { edit_others_posts: true, publish_posts: false } } }
			}>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="post" user={ user }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
