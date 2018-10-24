/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostPublishPanel } from '../index';

describe( 'PostPublishPanel', () => {
	it( 'should render the pre-publish panel if the post is not saving, published or scheduled', () => {
		const wrapper = shallow(
			<PostPublishPanel
				isPublished={ false }
				isScheduled={ false }
				isSaving={ false }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );
} );
