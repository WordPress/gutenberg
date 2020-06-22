/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../';

describe( 'PanelColorSettings', () => {
	it( 'should not render anything if there are no colors to choose', async () => {
		let root;

		await act( async () => {
			root = create(
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
		} );

		expect( root.toJSON() ).toBe( null );
	} );

	it( 'should render a color panel if at least one setting supports custom colors', async () => {
		let root;
		await act( async () => {
			root = create(
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
		} );
		expect( root ).not.toBe( null );
	} );

	it( 'should render a color panel if at least one setting specifies some colors to choose', async () => {
		let root;
		await act( async () => {
			root = create(
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
		} );
		expect( root ).not.toBe( null );
	} );

	it( 'should not render anything if none of the setting panels has colors to choose', async () => {
		let root;
		await act( async () => {
			root = create(
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
		} );
		expect( root ).not.toBe( null );
	} );
} );
