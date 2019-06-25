/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import BlockView from '../block-view';

describe( 'BlockView', () => {
	test( 'should match snapshot', () => {
		const wrapper = shallow( <BlockView title="title" rawContent="raw" renderedContent="render" action={ noop } actionText="action" className="class" /> );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
