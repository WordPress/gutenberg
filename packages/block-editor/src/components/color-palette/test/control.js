/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { ColorPaletteControl } from '../control';

describe( 'ColorPaletteControl', () => {
	it( 'matches the snapshot', () => {
		const wrapper = shallow(
			<ColorPaletteControl
				label="Test Color"
				value="#f00"
				colors={ [ { color: '#f00', name: 'red' } ] }
				onChange={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
