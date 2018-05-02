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
			<PostStickyCheck postType="page" post={ {
				_links: {
					self: [ {
						href: 'https://w.org/wp-json/wp/v2/posts/5',
					} ],
				},
				title: 'Not a stickyable post',
			} }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if post doesn\'t support stickying', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="post" post={ {
				_links: {
					self: [ {
						href: 'https://w.org/wp-json/wp/v2/posts/5',
					} ],
				},
				title: 'Not a stickyable post',
			} }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render if the post supports stickying', () => {
		const wrapper = shallow(
			<PostStickyCheck postType="post" post={ {
				_links: {
					self: [ {
						href: 'https://w.org/wp-json/wp/v2/posts/5',
					} ],
					'wp:action-sticky': [ {
						href: 'https://w.org/wp-json/wp/v2/posts/5',
					} ],
				},
				title: 'A stickyable post',
			} }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( wrapper.type() ).not.toBe( null );
	} );
} );
