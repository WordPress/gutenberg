/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostVisibilityCheck } from '../check';

describe( 'PostVisibilityCheck', () => {
	const user = {
		data: {
			post_type_capabilities: {
				publish_posts: true,
			},
		},
	};

	const render = ( { canEdit } ) => ( canEdit ? 'yes' : 'no' );

	it( 'should not render the edit link if the user doesn\'t have the right capability', () => {
		let wrapper = shallow( <PostVisibilityCheck user={ {} } render={ render } /> );
		expect( wrapper.text() ).toBe( 'no' );

		wrapper = shallow( <PostVisibilityCheck postType="post" render={ render } user={
			{ data: { post_type_capabilities: { publish_posts: false } } }
		} /> );
		expect( wrapper.text() ).toBe( 'no' );
	} );

	it( 'should render if the user has the correct capability', () => {
		const wrapper = shallow( <PostVisibilityCheck user={ user } render={ render } /> );
		expect( wrapper.text() ).toBe( 'yes' );
	} );
} );
