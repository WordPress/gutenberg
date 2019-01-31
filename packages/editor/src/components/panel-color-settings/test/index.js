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
		expect( wrapper.dive() ).toMatchSnapshot();
	} );

	it( 'should not render anything if there are no colors to choose', () => {
		const wrapper = shallow(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
				disableCustomColors={ true }
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

		expect( wrapper.type() ).toBeNull();
	} );

	it( 'should render a color panel if at least one setting supports custom colors', () => {
		const wrapper = shallow(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
				disableCustomColors={ true }
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
						disableCustomColors: false,
					},
				] }
			/>
		);
		expect( wrapper.type() ).not.toBeNull();
		expect( wrapper ).toMatchSnapshot();
		expect( wrapper.dive() ).toMatchSnapshot();
	} );

	it( 'should render a color panel if at least one setting specifies some colors to choose', () => {
		const wrapper = shallow(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
				disableCustomColors={ true }
				colorSettings={ [
					{
						value: '#000',
						onChange: noop,
						label: 'border color',
						colors: [ {
							slug: 'red',
							name: 'Red',
							color: '#ff0000',
						} ],
					},
					{
						value: '#111',
						onChange: noop,
						label: 'background color',
					},
				] }
			/>
		);
		expect( wrapper.type() ).not.toBeNull();
		expect( wrapper ).toMatchSnapshot();
		expect( wrapper.dive() ).toMatchSnapshot();
	} );

	it( 'should not render anything if none of the setting panels has colors to choose', () => {
		const wrapper = shallow(
			<PanelColorSettings
				title="Test Title"
				disableCustomColors={ false }
				colorSettings={ [
					{
						value: '#000',
						onChange: noop,
						label: 'border color',
						colors: [],
						disableCustomColors: true,
					},
					{
						value: '#111',
						onChange: noop,
						label: 'background color',
						colors: [],
						disableCustomColors: true,
					},
				] }
			/>
		);
		expect( wrapper.type() ).toBeNull();
	} );
} );
