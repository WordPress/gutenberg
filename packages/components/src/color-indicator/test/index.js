/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ColorIndicator from '../';

describe( 'ColorIndicator', () => {
	it( 'matches the snapshot', () => {
		const wrapper = shallow(
			<ColorIndicator aria-label="sample label" colorValue="#fff" />
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
