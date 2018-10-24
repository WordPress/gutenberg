/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies.
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle', () => {
	it( 'should render button when the post is published', () => {
		const wrapper = shallow( <PostPublishButtonOrToggle isPublished={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
