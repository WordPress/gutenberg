/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies.
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle should render a ', () => {
	it( 'button when the publish sidebar is not enabled and the viewport is > small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPublishSidebarEnabled={ false }
			isSmallViewport={ false }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'toggle when the publish sidebar is not enabled and the viewport is <= small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPublishSidebarEnabled={ false }
			isSmallViewport={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

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

	it( 'button when the post is pending, it cannot be published, and the viewport is not small ', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPending={ true }
			hasPublishAction={ false }
			isSmallViewport={ false }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'toggle when the post is pending, it cannot be published, and the viewport is small ', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPending={ true }
			hasPublishAction={ false }
			isSmallViewport={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
