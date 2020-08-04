/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ListEdit from '../edit';

describe( 'ListEdit component', () => {
	it( 'renders without crashing', () => {
		const wrapper = shallow( <ListEdit attributes={ {} } /> );
		expect( wrapper ).toBeTruthy();
	} );
} );
