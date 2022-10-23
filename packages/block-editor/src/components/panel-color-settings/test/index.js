/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../';

const noop = () => {};

describe( 'PanelColorSettings', () => {
	it( 'should not render anything if there are no colors to choose', async () => {
		const { container } = render(
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
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render a color panel if at least one setting supports custom colors', async () => {
		const { container } = render(
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
		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should render a color panel if at least one setting specifies some colors to choose', async () => {
		const { container } = render(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
				disableCustomColors={ true }
				colorSettings={ [
					{
						value: '#000',
						onChange: noop,
						label: 'border color',
						colors: [
							{
								slug: 'red',
								name: 'Red',
								color: '#ff0000',
							},
						],
					},
					{
						value: '#111',
						onChange: noop,
						label: 'background color',
					},
				] }
			/>
		);
		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should not render anything if none of the setting panels has colors to choose', async () => {
		const { container } = render(
			<PanelColorSettings
				title="Test Title"
				colors={ [] }
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
		expect( container ).not.toBeEmptyDOMElement();
	} );
} );
