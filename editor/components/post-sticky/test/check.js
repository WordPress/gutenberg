/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostStickyCheck } from '../check';

describe( 'PostSticky', () => {
	it( 'should not render anything if the post type is not "post"', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="page" canPublishPosts canEditOtherPosts>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if the user doesn\'t have the right capabilities', () => {
		let wrapper = shallow(
			<PostStickyCheck postType="post">
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );

		wrapper = shallow(
			<PostStickyCheck postType="post" canPublishPosts canEditOtherPosts={ false }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );

		wrapper = shallow(
			<PostStickyCheck postType="post" canPublishPosts={ false } canEditOtherPosts>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="post" canPublishPosts canEditOtherPosts>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
