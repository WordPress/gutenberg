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
						label: 'border color',
					},
					{
						value: '#111',
						onChange: noop,
						label: 'background color',
					},
				] }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
