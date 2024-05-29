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
				defaultScale="cover"
				defaultAspectRatio="auto"
				aspectRatioOptions={ [
					{ label: 'Original', value: 'auto' },
					{ label: '16/9', value: '16/9' },
					{
						label: 'Custom',
						value: 'custom',
						disabled: true,
						hidden: true,
					},
				] }
				value={ value }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

// (xxxx) -> (yyyy) is a shorthand for categorizing the test cases by initial
// state (xxxx) and final state (yyyy). Each digit represents whether or not the
// value is set, in the order: [aspectRatio, scale, width, height].
//
// See https://github.com/WordPress/gutenberg/pull/51545#issuecomment-1601326289

// Using expect( onChange.mock.calls ).toStrictEqual(...) so undefined
// properties are treated differently from missing properties.

describe( 'DimensionsTool', () => {
	describe( 'updating aspectRatio', () => {
		it( 'when starting with empty initial state, setting aspectRatio also sets scale (0000) -> (1100)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				// scale,
				// width,
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, '16/9' );

			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { aspectRatio: '16/9', scale: 'cover' } ],
			] );
		} );

		it( 'when starting with just height, setting aspectRatio also sets scale (0001) -> (1101)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				// scale,
				// width,
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, '16/9' );

			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { aspectRatio: '16/9', scale: 'cover', height: '6px' } ],
			] );
		} );

		it( 'when starting with just width, setting aspectRatio also sets scale (0010) -> (1110)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				// scale,
				width: '8px',
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, '16/9' );

			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { aspectRatio: '16/9', scale: 'cover', width: '8px' } ],
			] );
		} );

		it( 'when starting with scale, width, and height, setting aspectRatio also clears height (0111) -> (1110)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				scale: 'cover',
				width: '8px',
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, '16/9' );

			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { aspectRatio: '16/9', scale: 'cover', width: '8px' } ],
			] );
		} );

		it( 'when starting with aspectRatio and scale, setting aspectRatio to "Original" also clears scale (1100) -> (0000)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				aspectRatio: '16/9',
				scale: 'cover',
				// width,
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, 'auto' );

			expect( aspectRatioSelect ).toHaveValue( 'auto' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).not.toBeInTheDocument();

			expect( onChange.mock.calls ).toStrictEqual( [ [ {} ] ] );
		} );

		it( 'when starting with aspectRatio, scale, and height, setting aspectRatio to "Original" also clears scale (1101) -> (0001)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				aspectRatio: '16/9',
				scale: 'cover',
				// width,
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, 'auto' );

			expect( aspectRatioSelect ).toHaveValue( 'auto' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).not.toBeInTheDocument();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { height: '6px' } ],
			] );
		} );

		it( 'when starting with aspectRatio, scale, and width, setting aspectRatio to "Original" also clears scale (1110) -> (0010)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				aspectRatio: '16/9',
				scale: 'cover',
				width: '8px',
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			await user.selectOptions( aspectRatioSelect, 'auto' );

			expect( aspectRatioSelect ).toHaveValue( 'auto' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).not.toBeInTheDocument();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { width: '8px' } ],
			] );
		} );
	} );

	describe( 'updating scale', () => {
		// No custom interactions here. Things should just update normally.
	} );

	describe( 'updating dimensions', () => {
		it( 'when starting with just height, setting width also sets scale (0001) -> (0111)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				// scale,
				// width,
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			await user.type( widthInput, '8' );

			expect( widthInput ).toHaveValue( 8 );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { scale: 'cover', width: '8px', height: '6px' } ],
			] );
		} );

		it( 'when starting with just width, setting height also sets scale (0010) -> (0111)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				// scale,
				width: '8px',
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );

			await user.type( heightInput, '6' );

			expect( heightInput ).toHaveValue( 6 );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { scale: 'cover', width: '8px', height: '6px' } ],
			] );
		} );

		it( 'when starting with scale, width, and height, clearing width also clears scale (0111) -> (0001)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				scale: 'cover',
				width: '8px',
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			await user.clear( widthInput );

			expect( widthInput ).toHaveValue( null );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).not.toBeInTheDocument();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { height: '6px' } ],
			] );
		} );

		it( 'when starting with scale, width, and height, clearing height also clears scale (0111) -> (0010)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				// aspectRatio,
				scale: 'cover',
				width: '8px',
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );

			await user.clear( heightInput );

			expect( heightInput ).toHaveValue( null );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).not.toBeInTheDocument();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { width: '8px' } ],
			] );
		} );

		it( 'when starting with aspectRatio, scale, and height, setting width also clears aspectRatio (1101) -> (0111)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				aspectRatio: '16/9',
				scale: 'cover',
				// width,
				height: '6px',
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			await user.type( widthInput, '8' );

			expect( widthInput ).toHaveValue( 8 );

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			expect( aspectRatioSelect ).toHaveValue( 'custom' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { scale: 'cover', width: '8px', height: '6px' } ],
			] );
		} );

		it( 'when starting with aspectRatio, scale, and width, setting height also clears aspectRatio (1110) -> (0111)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			const initialValue = {
				aspectRatio: '16/9',
				scale: 'cover',
				width: '8px',
				// height,
			};

			render(
				<Example initialValue={ initialValue } onChange={ onChange } />
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );

			await user.type( heightInput, '6' );

			expect( heightInput ).toHaveValue( 6 );

			const aspectRatioSelect = screen.getByRole( 'combobox', {
				name: 'Aspect ratio',
			} );

			expect( aspectRatioSelect ).toHaveValue( 'custom' );

			const scaleRadioGroup = screen.queryByRole( 'radiogroup', {
				name: 'Scale',
			} );

			expect( scaleRadioGroup ).toBeInTheDocument();

			const scaleCoverRadio = screen.getByRole( 'radio', {
				name: 'Cover',
			} );

			expect( scaleCoverRadio ).toBeChecked();

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { scale: 'cover', width: '8px', height: '6px' } ],
			] );
		} );
	} );

	describe( 'internal component state', () => {
		it( 'when aspect ratio is change to custom by setting width and height then removing a width value should return the original aspect ratio (1100) -> (1110) -> (0111) -> (1101)', async () => {
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

			await user.type( widthInput, '8' );
			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			await user.type( heightInput, '6' );
			expect( aspectRatioSelect ).toHaveValue( 'custom' );

			await user.clear( widthInput, '' );
			expect( aspectRatioSelect ).toHaveValue( '16/9' );

			expect( onChange.mock.calls ).toStrictEqual( [
				[ { aspectRatio: '16/9', scale: 'cover', width: '8px' } ],
				[ { scale: 'cover', width: '8px', height: '6px' } ],
				[ { aspectRatio: '16/9', scale: 'cover', height: '6px' } ],
			] );
		} );

		it( 'when custom scale is set then aspect ratio is set to original and then aspect ratio is changed back (1100) -> (1100) -> (0000) -> (1100)', async () => {
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
} );
