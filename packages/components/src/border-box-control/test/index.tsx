/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { BorderBoxControl } from '..';

const colors = [
	{ name: 'Gray', color: '#f6f7f7' },
	{ name: 'Blue', color: '#72aee6' },
	{ name: 'Red', color: '#e65054' },
	{ name: 'Green', color: '#00a32a' },
	{ name: 'Yellow', color: '#bd8600' },
];

const defaultBorder = {
	color: '#72aee6',
	style: 'solid',
	width: '1px',
};

const defaultBorders = {
	top: defaultBorder,
	right: defaultBorder,
	bottom: defaultBorder,
	left: defaultBorder,
};

const mixedBorders = {
	top: { color: '#f6f7f7', style: 'solid', width: '1px' },
	right: { color: '#e65054', style: 'dashed', width: undefined },
	bottom: { color: undefined, style: 'dotted', width: '2rem' },
	left: { color: '#bd8600', style: undefined, width: '0.75em' },
};

const props = {
	colors,
	label: 'Border Box',
	onChange: jest.fn().mockImplementation( ( newValue ) => {
		props.value = newValue;
	} ),
	value: undefined,
};

const toggleLabelRegex = /Border color( and style)* picker/;
const colorPickerRegex = /Border color picker/;

describe( 'BorderBoxControl', () => {
	describe( 'Linked view rendering', () => {
		it( 'should render correctly when no value provided', () => {
			render( <BorderBoxControl { ...props } /> );

			const label = screen.getByText( props.label );
			const colorButton = screen.getByLabelText( toggleLabelRegex );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Border width',
			} );
			const unitSelect = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );
			const slider = screen.getByRole( 'slider', {
				name: 'Border width',
			} );
			const linkedButton = screen.getByLabelText( 'Unlink sides' );

			expect( label ).toBeInTheDocument();
			expect( colorButton ).toBeInTheDocument();
			expect( widthInput ).toBeInTheDocument();
			expect( widthInput ).not.toHaveAttribute( 'placeholder' );
			expect( unitSelect ).toBeInTheDocument();
			expect( slider ).toBeInTheDocument();
			expect( linkedButton ).toBeInTheDocument();
		} );

		it( 'should hide label', () => {
			render( <BorderBoxControl { ...props } hideLabelFromVision /> );

			const label = screen.getByText( props.label );

			// As visually hidden labels are still included in the document
			// and do not have `display: none` styling, we can't rely on
			// `.toBeInTheDocument()` or `.toBeVisible()` assertions.
			expect( label ).toHaveAttribute(
				'data-wp-component',
				'VisuallyHidden'
			);
		} );

		it( 'should show correct width value when flat border value provided', () => {
			render( <BorderBoxControl { ...props } value={ defaultBorder } /> );

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Border width',
			} ) as HTMLInputElement;

			expect( widthInput.value ).toBe( '1' );
		} );

		it( 'should show correct width value when consistent split borders provided', () => {
			render(
				<BorderBoxControl { ...props } value={ defaultBorders } />
			);

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Border width',
			} ) as HTMLInputElement;

			expect( widthInput.value ).toBe( '1' );
		} );

		it( 'should render placeholder and omit unit select when border values are mixed', async () => {
			const user = userEvent.setup();

			render( <BorderBoxControl { ...props } value={ mixedBorders } /> );

			// There are 4 inputs when in unlinked mode (top/right/bottom/left)
			expect(
				screen.getAllByRole( 'spinbutton', {
					name: 'Border width',
				} )
			).toHaveLength( 4 );

			// First render of control with mixed values should show split view.
			await user.click(
				screen.getByRole( 'button', { name: 'Link sides' } )
			);

			// In linked mode, there is only one input
			await waitFor( () =>
				expect(
					screen.getByRole( 'spinbutton', {
						name: 'Border width',
					} )
				).toBeVisible()
			);

			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Border width',
			} );
			const unitSelect = screen.queryByRole( 'combobox', {
				name: 'Select unit',
			} );

			expect( widthInput ).toHaveAttribute( 'placeholder', 'Mixed' );
			expect( unitSelect ).not.toBeInTheDocument();
		} );

		it( 'should render shared border width and unit select when switching to linked view', async () => {
			const user = userEvent.setup();

			// Render control with mixed border values but consistent widths.
			render(
				<BorderBoxControl
					{ ...props }
					value={ {
						top: { color: 'red', width: '5px', style: 'solid' },
						right: { color: 'blue', width: '5px', style: 'dashed' },
						bottom: {
							color: 'green',
							width: '5px',
							style: 'solid',
						},
						left: {
							color: 'yellow',
							width: '5px',
							style: 'dotted',
						},
					} }
				/>
			);

			// First render of control with mixed values should show split view.
			await user.click(
				screen.getByRole( 'button', { name: 'Link sides' } )
			);

			const linkedInput = screen.getByRole( 'spinbutton', {
				name: 'Border width',
			} ) as HTMLInputElement;
			const unitSelect = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );

			expect( linkedInput.value ).toBe( '5' );
			expect( unitSelect ).toBeInTheDocument();
		} );

		it( 'should omit style options when requested', async () => {
			const user = userEvent.setup();

			render( <BorderBoxControl { ...props } enableStyle={ false } /> );

			const colorButton = screen.getByLabelText( colorPickerRegex );
			await user.click( colorButton );

			// Wait for the custom color picker in the dropdown to appear
			await waitFor( () =>
				expect(
					screen.getByRole( 'button', {
						name: 'Custom color picker.',
					} )
				).toBeVisible()
			);

			// Make sure that none of the border style buttons (and the section
			// title) are rendered to screen.
			expect( screen.queryByText( 'Style' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /(Solid)|(Dashed)|(Dotted)/,
				} )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Split view rendering', () => {
		it( 'should render split view by default when mixed values provided', () => {
			render( <BorderBoxControl { ...props } value={ mixedBorders } /> );

			const colorButtons = screen.getAllByLabelText( toggleLabelRegex );
			const widthInputs = screen.getAllByRole( 'spinbutton', {
				name: 'Border width',
			} );
			const unitSelects = screen.getAllByRole( 'combobox', {
				name: 'Select unit',
			} );
			const sliders = screen.queryAllByRole( 'slider', {
				name: 'Border width',
			} );
			const linkedButton = screen.getByLabelText( 'Link sides' );

			expect( colorButtons.length ).toBe( 4 );
			expect( widthInputs.length ).toBe( 4 );
			expect( unitSelects.length ).toBe( 4 );
			expect( sliders.length ).toBe( 0 );
			expect( linkedButton ).toBeInTheDocument();
		} );

		it( 'should render correct width values in appropriate inputs', () => {
			render( <BorderBoxControl { ...props } value={ mixedBorders } /> );

			const widthInputs = screen.getAllByRole( 'spinbutton', {
				name: 'Border width',
			} ) as HTMLInputElement[];

			expect( widthInputs[ 0 ].value ).toBe( '1' ); // Top.
			expect( widthInputs[ 1 ].value ).toBe( '0.75' ); // Left.
			expect( widthInputs[ 2 ].value ).toBe( '' ); // Right.
			expect( widthInputs[ 3 ].value ).toBe( '2' ); // Bottom.
		} );

		it( 'should render split view correctly when starting with flat border', async () => {
			const user = userEvent.setup();

			render(
				<BorderBoxControl { ...props } value={ defaultBorders } />
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			const widthInputs = screen.getAllByRole( 'spinbutton', {
				name: 'Border width',
			} ) as HTMLInputElement[];
			expect( widthInputs[ 0 ].value ).toBe( '1' ); // Top.
			expect( widthInputs[ 1 ].value ).toBe( '1' ); // Left.
			expect( widthInputs[ 2 ].value ).toBe( '1' ); // Right.
			expect( widthInputs[ 3 ].value ).toBe( '1' ); // Bottom.
		} );

		// We're expecting to have 4 color buttons by default.
		const colorButtonIndexes = [ ...Array( 4 ).keys() ];

		it.each( colorButtonIndexes )(
			'should omit style options when color button %s is pressed',
			async ( colorButtonIndex ) => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl { ...props } enableStyle={ false } />
				);

				await user.click(
					screen.getByRole( 'button', { name: 'Unlink sides' } )
				);

				const colorButtons =
					screen.getAllByLabelText( colorPickerRegex );

				await user.click( colorButtons[ colorButtonIndex ] );

				// Make sure that none of the border style buttons (and the section
				// title) are rendered to screen.
				expect( screen.queryByText( 'Style' ) ).not.toBeInTheDocument();
				expect(
					screen.queryByRole( 'button', {
						name: /(Solid)|(Dashed)|(Dotted)/,
					} )
				).not.toBeInTheDocument();
			}
		);
	} );

	describe( 'onChange handling', () => {
		beforeEach( () => {
			jest.clearAllMocks();
			props.value = undefined;
		} );

		describe( 'Linked value change handling', () => {
			it( 'should set undefined when new border is empty', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl { ...props } value={ { width: '1px' } } />
				);

				await user.clear(
					screen.getByRole( 'spinbutton', { name: 'Border width' } )
				);

				expect( props.onChange ).toHaveBeenCalledWith( undefined );
			} );

			it( 'should update with complete flat border', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl { ...props } value={ defaultBorder } />
				);

				const widthInput = screen.getByRole( 'spinbutton', {
					name: 'Border width',
				} );
				await user.clear( widthInput );
				await user.type( widthInput, '3' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '3px',
				} );
			} );

			it( 'should maintain mixed values if not explicitly set via linked control', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl
						{ ...props }
						value={ {
							top: { color: '#72aee6' },
							right: { color: '#f6f7f7', style: 'dashed' },
							bottom: { color: '#e65054', style: 'dotted' },
							left: { color: undefined },
						} }
					/>
				);

				await user.click(
					screen.getByRole( 'button', { name: 'Link sides' } )
				);

				const widthInput = screen.getByRole( 'spinbutton', {
					name: 'Border width',
				} );
				await user.clear( widthInput );
				await user.type( widthInput, '4' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					top: { color: '#72aee6', width: '4px' },
					right: { color: '#f6f7f7', style: 'dashed', width: '4px' },
					bottom: { color: '#e65054', style: 'dotted', width: '4px' },
					left: { color: undefined, width: '4px' },
				} );
			} );

			it( 'should update with consistent split borders', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl { ...props } value={ defaultBorders } />
				);

				const widthInput = screen.getByRole( 'spinbutton', {
					name: 'Border width',
				} );
				await user.clear( widthInput );
				await user.type( widthInput, '10' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '10px',
				} );
			} );

			it( 'should set undefined borders when change results in empty borders', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl
						{ ...props }
						value={ {
							top: { width: '1px' },
							right: { width: '1px' },
							bottom: { width: '1px' },
							left: { width: '1px' },
						} }
					/>
				);

				await user.clear(
					screen.getByRole( 'spinbutton', { name: 'Border width' } )
				);

				expect( props.onChange ).toHaveBeenCalledWith( undefined );
			} );

			it( 'should set flat border when change results in consistent split borders', async () => {
				const user = userEvent.setup();

				render(
					<BorderBoxControl
						{ ...props }
						value={ {
							top: { ...defaultBorder, width: '1px' },
							right: { ...defaultBorder, width: '2px' },
							bottom: { ...defaultBorder, width: '3px' },
							left: { ...defaultBorder, width: '4px' },
						} }
					/>
				);

				await user.click(
					screen.getByRole( 'button', { name: 'Link sides' } )
				);

				const widthInput = screen.getByRole( 'spinbutton', {
					name: 'Border width',
				} );
				await user.clear( widthInput );
				await user.type( widthInput, '10' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '10px',
				} );
			} );
		} );

		describe( 'Split value change handling', () => {
			it( 'should set split borders when the updated borders are mixed', async () => {
				const user = userEvent.setup();

				const borders = {
					top: { ...defaultBorder, width: '1px' },
					right: { ...defaultBorder, width: '2px' },
					bottom: { ...defaultBorder, width: '3px' },
					left: { ...defaultBorder, width: '4px' },
				};

				render( <BorderBoxControl { ...props } value={ borders } /> );

				const widthInput = screen.getAllByRole( 'spinbutton', {
					name: 'Border width',
				} )[ 0 ];
				await user.clear( widthInput );
				await user.type( widthInput, '5' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...borders,
					top: { ...defaultBorder, width: '5px' },
				} );
			} );

			it( 'should set flat border when updated borders are consistent', async () => {
				const user = userEvent.setup();

				const borders = {
					top: { ...defaultBorder, width: '4px' },
					right: { ...defaultBorder, width: '1px' },
					bottom: { ...defaultBorder, width: '1px' },
					left: { ...defaultBorder, width: '1px' },
				};

				render( <BorderBoxControl { ...props } value={ borders } /> );

				const widthInput = screen.getAllByRole( 'spinbutton', {
					name: 'Border width',
				} )[ 0 ];
				await user.clear( widthInput );
				await user.type( widthInput, '1' );

				expect( props.onChange ).toHaveBeenCalledWith( defaultBorder );
			} );
		} );
	} );
} );
