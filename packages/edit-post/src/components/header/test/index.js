/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies.
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle', () => {
	it( 'should render button when the publish sidebar is not enabled and the viewport is > small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPublishSidebarEnabled={ false }
			isSmallViewport={ false }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should render toggle when the publish sidebar is not enabled and the viewport is <= small', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle
			isPublishSidebarEnabled={ false }
			isSmallViewport={ true }
		/> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should render button when the post is published', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublished={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
