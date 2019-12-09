/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle should render a', () => {
	it( 'button when the post is published (1)', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublished={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when the post is scheduled (2)', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isScheduled={ true }
			isBeingScheduled={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when the post is pending and cannot be published but the viewport is >= medium (3)', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPending={ true }
			hasPublishAction={ false }
		/> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'toggle when post is not (1), (2), (3), the viewport is >= medium, and the publish sidebar is enabled', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublishSidebarEnabled={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when post is not (1), (2), (3), the viewport is >= medium, and the publish sidebar is disabled', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublishSidebarEnabled={ false } /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
