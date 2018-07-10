/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { PanelColorSettings } from '../';

describe( 'PanelColorSettings', () => {
	it( 'matches the snapshot', () => {
		const wrapper = shallow(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
				colorSettings={ [
					{
						value: '#000',
						onChange: noop,
						colorIndicatorAriaLabel: 'black',
						label: 'black color',
					},
					{
						value: '#111',
						onChange: noop,
						colorIndicatorAriaLabel: 'nearly black',
						label: 'nearly black color',
					},
				] }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
