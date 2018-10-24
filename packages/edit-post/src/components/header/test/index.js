/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies.
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle should render a ', () => {
	it( 'button when the post is published', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublished={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when the post is scheduled', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isScheduled={ true }
			isBeingScheduled={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when the post is pending and cannot be published but the viewport is > small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPending={ true }
			hasPublishAction={ false }
			isSmallViewport={ false }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'toggle when post is not published or scheduled and the viewport is small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isScheduled={ false }
			isPublished={ false }
			isSmallViewport={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'toggle when post is not published or scheduled, the viewport is not small, and the publish sidebar is enabled', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isScheduled={ false }
			isPublished={ false }
			isSmallViewport={ false }
			isPublishSidebarEnabled={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'button when post is not published or scheduled, the viewport is not small, and the publish sidebar is disabled', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isScheduled={ false }
			isPublished={ false }
			isSmallViewport={ false }
			isPublishSidebarEnabled={ false }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
