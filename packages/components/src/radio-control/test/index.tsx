/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RadioControl from '../';

const ControlledRadioControl = ( {
	...props
}: React.ComponentProps< typeof RadioControl > ) => {
	const [ option, setOption ] = useState( props.selected );

	return (
		<RadioControl
			{ ...props }
			onChange={ ( newValue ) => {
				setOption( newValue );
				props.onChange?.( newValue );
			} }
			selected={ option }
		/>
	);
};

const defaultProps = {
	options: [
		{ label: 'Mouse', value: 'mouse' },
		{ label: 'Cat', value: 'cat' },
		{ label: 'Dog', value: 'dog' },
	],
	label: 'Animal',
};

const defaultPropsWithDescriptions = {
	...defaultProps,
	options: defaultProps.options.map( ( option, index ) => ( {
		...option,
		description: `This is the option number ${ index + 1 }.`,
	} ) ),
};

describe.each( [
	// TODO: `RadioControl` doesn't currently support uncontrolled mode.
	// [ 'uncontrolled', RadioControl ],
	[ 'controlled', ControlledRadioControl ],
] )( 'RadioControl %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	describe( 'semantics and labelling', () => {
		it( 'should group all radios under a fieldset with an accessible label (legend)', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			expect(
				screen.getByRole( 'group', { name: defaultProps.label } )
			).toBeVisible();
		} );

		it( 'should group all radios under a fieldset with an accessible label even when the label is visually hidden', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component
					{ ...defaultProps }
					hideLabelFromVision
					onChange={ onChangeSpy }
				/>
			);

			expect(
				screen.getByRole( 'group', { name: defaultProps.label } )
			).toBeVisible();
		} );

		it( 'should describe the radio group with the help text', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component
					{ ...defaultProps }
					help="Test help text"
					onChange={ onChangeSpy }
				/>
			);

			expect(
				screen.getByRole( 'group', { name: defaultProps.label } )
			).toHaveAccessibleDescription( 'Test help text' );
		} );

		it( 'should render radio inputs with accessible labels', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			for ( const option of defaultProps.options ) {
				const optionEl = screen.getByRole( 'radio', {
					name: option.label,
				} );
				expect( optionEl ).toBeVisible();
				expect( optionEl ).not.toBeChecked();
			}
		} );

		it( 'should not select have a selected value when the `selected` prop does not match any available options', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			expect(
				screen.queryByRole( 'radio', {
					checked: true,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should render mutually exclusive radio inputs', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component
					{ ...defaultProps }
					onChange={ onChangeSpy }
					selected={ defaultProps.options[ 1 ].value }
				/>
			);

			expect(
				screen.getByRole( 'radio', {
					checked: true,
				} )
			).toHaveAccessibleName( defaultProps.options[ 1 ].label );
		} );

		it( 'should use the option description text to describe individual options', () => {
			const onChangeSpy = jest.fn();
			render(
				<Component
					{ ...defaultPropsWithDescriptions }
					onChange={ onChangeSpy }
					selected={ defaultProps.options[ 1 ].value }
					help="Select your favorite animal"
				/>
			);

			// Group help text should not be used to describe individual options.
			let index = 1;
			for ( const option of defaultProps.options ) {
				expect(
					screen.getByRole( 'radio', { name: option.label } )
				).toHaveAccessibleDescription(
					`This is the option number ${ index }.`
				);
				index += 1;
			}
		} );
	} );

	describe( 'interaction', () => {
		it( 'should select a new value when clicking on the radio input', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			// Click on the third radio, make sure it's selected.
			await user.click(
				screen.getByRole( 'radio', {
					name: defaultProps.options[ 2 ].label,
				} )
			);
			expect(
				screen.getByRole( 'radio', {
					checked: true,
				} )
			).toHaveAccessibleName( defaultProps.options[ 2 ].label );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				defaultProps.options[ 2 ].value
			);
		} );

		it( 'should select a new value when clicking on the radio label', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			// Click on the second radio's label, make sure it selects the associated radio.
			await user.click(
				screen.getByText( defaultProps.options[ 1 ].label )
			);
			expect(
				screen.getByRole( 'radio', {
					checked: true,
				} )
			).toHaveAccessibleName( defaultProps.options[ 1 ].label );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				defaultProps.options[ 1 ].value
			);
		} );

		it( 'should select a new value when using the arrow keys', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();
			render(
				<Component { ...defaultProps } onChange={ onChangeSpy } />
			);

			await user.tab();

			expect(
				screen.getByRole( 'radio', {
					name: defaultProps.options[ 0 ].label,
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );

			expect(
				screen.getByRole( 'radio', {
					checked: true,
					name: defaultProps.options[ 1 ].label,
				} )
			).toHaveFocus();
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				defaultProps.options[ 1 ].value
			);

			await user.keyboard( '{ArrowDown}' );
			await user.keyboard( '{ArrowDown}' );

			// The selection wrap around.
			expect(
				screen.getByRole( 'radio', {
					checked: true,
					name: defaultProps.options[ 0 ].label,
				} )
			).toHaveFocus();
			// TODO: why called twice for every interaction?
			expect( onChangeSpy ).toHaveBeenCalledTimes( 6 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				defaultProps.options[ 0 ].value
			);

			await user.keyboard( '{ArrowUp}' );

			expect(
				screen.getByRole( 'radio', {
					checked: true,
					name: defaultProps.options[ 2 ].label,
				} )
			).toHaveFocus();

			expect( onChangeSpy ).toHaveBeenCalledTimes( 8 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				defaultProps.options[ 2 ].value
			);
		} );
	} );
} );
