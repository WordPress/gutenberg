/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DimensionsTool from '../';

const EMPTY_OBJECT = {};

function Example( { initialValue, onChange, ...props } ) {
	const [ value, setValue ] = useState( initialValue );
	const resetAll = () => {
		setValue( EMPTY_OBJECT );
		onChange( EMPTY_OBJECT );
	};
	return (
		<ToolsPanel label="Dimensions" panelId="panel-id" resetAll={ resetAll }>
			<DimensionsTool
				panelId="panel-id"
				onChange={ ( nextValue ) => {
					setValue( nextValue );
					onChange( nextValue );
				} }
				value={ value }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

describe( 'DimensionsTool', () => {
	it( 'when aspect ratio is changed to original scale and aspect ratio should be removed', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		const initialValue = {
			aspectRatio: '16/9',
			scale: 'cover',
		};

		render( <Example value={ initialValue } onChange={ onChange } /> );

		const aspectRatioSelect = screen.getByRole( 'combobox', {
			name: 'Aspect ratio',
		} );

		await user.selectOptions( aspectRatioSelect, 'auto' );

		expect( onChange.mock.calls[ 0 ] ).toStrictEqual( [ {} ] );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'when aspect ratio is changed to original and width is set height should be removed', async () => {} );

	it( 'when aspect ratio is change to custom by setting width and height then removing a width value should return the original aspect ratio', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		const value = {
			aspectRatio: '16/9',
			scale: 'cover',
		};

		render( <Example initialValue={ value } onChange={ onChange } /> );

		const aspectRatioSelect = screen.getByRole( 'combobox', {
			name: 'Aspect ratio',
		} );

		const widthInput = screen.getByRole( 'spinbutton', {
			name: 'Width',
		} );

		const heightInput = screen.getByRole( 'spinbutton', {
			name: 'Height',
		} );

		await user.type( widthInput, '100' );
		await user.type( heightInput, '200' );
		expect( aspectRatioSelect ).toHaveValue( 'custom' );

		await user.clear( widthInput, '' );
		expect( aspectRatioSelect ).toHaveValue( '16/9' );

		// Use toStrictEqual so undefined properties are treated differently
		// from missing properties.
		// expect( onChange.mock.calls ).toStrictEqual( [
		// 	[ { aspectRatio: '16/9', scale: 'contain' } ],
		// 	[ {} ],
		// 	[ { aspectRatio: '16/9', scale: 'contain' } ],
		// ] );
	} );

	it( 'when custom scale is set then aspect ratio is set to original and then aspect ratio is changed back', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		const value = {
			aspectRatio: '16/9',
			scale: 'cover',
		};

		render( <Example initialValue={ value } onChange={ onChange } /> );

		const aspectRatioSelect = screen.getByRole( 'combobox', {
			name: 'Aspect ratio',
		} );

		const scaleContainRadio = screen.getByRole( 'radio', {
			name: 'Contain',
		} );

		await user.click( scaleContainRadio );
		expect( scaleContainRadio ).toBeChecked();

		await user.selectOptions( aspectRatioSelect, 'auto' );
		expect( aspectRatioSelect ).toHaveValue( 'auto' );

		await user.selectOptions( aspectRatioSelect, '16/9' );
		expect( aspectRatioSelect ).toHaveValue( '16/9' );

		// Use toStrictEqual so undefined properties are treated differently
		// from missing properties.
		expect( onChange.mock.calls ).toStrictEqual( [
			[ { aspectRatio: '16/9', scale: 'contain' } ],
			[ {} ],
			[
				{
					aspectRatio: '16/9',
					scale: 'contain',
				},
			],
		] );
	} );
} );
