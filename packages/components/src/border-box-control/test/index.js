/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { BorderBoxControl } from '../';

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

const renderBorderBoxControl = ( customProps ) => {
	return render( <BorderBoxControl { ...{ ...props, ...customProps } } /> );
};

const clickButton = ( name ) => {
	fireEvent.click( screen.getByRole( 'button', { name } ) );
};

const queryButton = ( name ) => {
	return screen.queryByRole( 'button', { name } );
};

const updateLinkedWidthInput = ( value ) => {
	const widthInput = screen.getByRole( 'spinbutton' );
	widthInput.focus();
	fireEvent.change( widthInput, { target: { value } } );
};

const updateSplitWidthInput = ( value, index = 0 ) => {
	const splitInputs = screen.getAllByRole( 'spinbutton' );
	splitInputs[ index ].focus();
	fireEvent.change( splitInputs[ index ], { target: { value } } );
};

describe( 'BorderBoxControl', () => {
	describe( 'Linked view rendering', () => {
		it( 'should render correctly when no value provided', () => {
			renderBorderBoxControl();

			const label = screen.getByText( props.label );
			const colorButton = screen.getByLabelText( toggleLabelRegex );
			const widthInput = screen.getByRole( 'spinbutton' );
			const unitSelect = screen.getByRole( 'combobox' );
			const slider = screen.getByRole( 'slider' );
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
			renderBorderBoxControl( { hideLabelFromVision: true } );
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
			renderBorderBoxControl( { value: defaultBorder } );
			const widthInput = screen.getByRole( 'spinbutton' );

			expect( widthInput.value ).toBe( '1' );
		} );

		it( 'should show correct width value when consistent split borders provided', () => {
			renderBorderBoxControl( { value: defaultBorders } );
			const widthInput = screen.getByRole( 'spinbutton' );

			expect( widthInput.value ).toBe( '1' );
		} );

		it( 'should render placeholder when border values are mixed', () => {
			renderBorderBoxControl( { value: mixedBorders } );

			// First render of control with mixed values should show split view.
			clickButton( 'Link sides' );

			const widthInput = screen.getByRole( 'spinbutton' );
			expect( widthInput ).toHaveAttribute( 'placeholder', 'Mixed' );
		} );

		it( 'should render shared border width when switching to linked view', async () => {
			// Render control with mixed border values but consistent widths.
			renderBorderBoxControl( {
				value: {
					top: { color: 'red', width: '5px', style: 'solid' },
					right: { color: 'blue', width: '5px', style: 'dashed' },
					bottom: { color: 'green', width: '5px', style: 'solid' },
					left: { color: 'yellow', width: '5px', style: 'dotted' },
				},
			} );

			// First render of control with mixed values should show split view.
			clickButton( 'Link sides' );
			const linkedInput = screen.getByRole( 'spinbutton' );

			expect( linkedInput.value ).toBe( '5' );
		} );

		it( 'should omit style options when requested', () => {
			renderBorderBoxControl( { enableStyle: false } );

			const colorButton = screen.getByLabelText( colorPickerRegex );
			fireEvent.click( colorButton );

			const styleLabel = screen.queryByText( 'Style' );
			const solidButton = queryButton( 'Solid' );
			const dashedButton = queryButton( 'Dashed' );
			const dottedButton = queryButton( 'Dotted' );

			expect( styleLabel ).not.toBeInTheDocument();
			expect( solidButton ).not.toBeInTheDocument();
			expect( dashedButton ).not.toBeInTheDocument();
			expect( dottedButton ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Split view rendering', () => {
		it( 'should render split view by default when mixed values provided', () => {
			renderBorderBoxControl( { value: mixedBorders } );

			const colorButtons = screen.getAllByLabelText( toggleLabelRegex );
			const widthInputs = screen.getAllByRole( 'spinbutton' );
			const unitSelects = screen.getAllByRole( 'combobox' );
			const sliders = screen.queryAllByRole( 'slider' );
			const linkedButton = screen.getByLabelText( 'Link sides' );

			expect( colorButtons.length ).toBe( 4 );
			expect( widthInputs.length ).toBe( 4 );
			expect( unitSelects.length ).toBe( 4 );
			expect( sliders.length ).toBe( 0 );
			expect( linkedButton ).toBeInTheDocument();
		} );

		it( 'should render correct width values in appropriate inputs', () => {
			renderBorderBoxControl( { value: mixedBorders } );

			const widthInputs = screen.getAllByRole( 'spinbutton' );

			expect( widthInputs[ 0 ].value ).toBe( '1' ); // Top.
			expect( widthInputs[ 1 ].value ).toBe( '0.75' ); // Left.
			expect( widthInputs[ 2 ].value ).toBe( '' ); // Right.
			expect( widthInputs[ 3 ].value ).toBe( '2' ); // Bottom.
		} );

		it( 'should render split view correctly when starting with flat border', () => {
			renderBorderBoxControl( { value: defaultBorders } );
			clickButton( 'Unlink sides' );

			const widthInputs = screen.getAllByRole( 'spinbutton' );
			expect( widthInputs[ 0 ].value ).toBe( '1' ); // Top.
			expect( widthInputs[ 1 ].value ).toBe( '1' ); // Left.
			expect( widthInputs[ 2 ].value ).toBe( '1' ); // Right.
			expect( widthInputs[ 3 ].value ).toBe( '1' ); // Bottom.
		} );

		it( 'should omit style options when requested', () => {
			renderBorderBoxControl( { enableStyle: false } );
			clickButton( 'Unlink sides' );

			const colorButtons = screen.getAllByLabelText( colorPickerRegex );

			colorButtons.forEach( ( button ) => {
				fireEvent.click( button );

				const styleLabel = screen.queryByText( 'Style' );
				const solidButton = queryButton( 'Solid' );
				const dashedButton = queryButton( 'Dashed' );
				const dottedButton = queryButton( 'Dotted' );

				expect( styleLabel ).not.toBeInTheDocument();
				expect( solidButton ).not.toBeInTheDocument();
				expect( dashedButton ).not.toBeInTheDocument();
				expect( dottedButton ).not.toBeInTheDocument();

				fireEvent.click( button );
			} );
		} );
	} );

	describe( 'onChange handling', () => {
		beforeEach( () => {
			jest.clearAllMocks();
			props.value = undefined;
		} );

		describe( 'Linked value change handling', () => {
			it( 'should set undefined when new border is empty', () => {
				renderBorderBoxControl( { value: { width: '1px' } } );
				updateLinkedWidthInput( '' );

				expect( props.onChange ).toHaveBeenCalledWith( undefined );
			} );

			it( 'should update with complete flat border', () => {
				renderBorderBoxControl( { value: defaultBorder } );
				updateLinkedWidthInput( '3' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '3px',
				} );
			} );

			it( 'should maintain mixed values if not explicitly set via linked control', () => {
				renderBorderBoxControl( {
					value: {
						top: { color: '#72aee6' },
						right: { color: '#f6f7f7', style: 'dashed' },
						bottom: { color: '#e65054', style: 'dotted' },
						left: { color: undefined },
					},
				} );

				clickButton( 'Link sides' );
				updateLinkedWidthInput( '4' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					top: { color: '#72aee6', width: '4px' },
					right: { color: '#f6f7f7', style: 'dashed', width: '4px' },
					bottom: { color: '#e65054', style: 'dotted', width: '4px' },
					left: { color: undefined, width: '4px' },
				} );
			} );

			it( 'should update with consistent split borders', () => {
				renderBorderBoxControl( { value: defaultBorders } );
				updateLinkedWidthInput( '10' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '10px',
				} );
			} );

			it( 'should set undefined borders when change results in empty borders', () => {
				renderBorderBoxControl( {
					value: {
						top: { width: '1px' },
						right: { width: '1px' },
						bottom: { width: '1px' },
						left: { width: '1px' },
					},
				} );
				updateLinkedWidthInput( '' );

				expect( props.onChange ).toHaveBeenCalledWith( undefined );
			} );

			it( 'should set flat border when change results in consistent split borders', () => {
				renderBorderBoxControl( {
					value: {
						top: { ...defaultBorder, width: '1px' },
						right: { ...defaultBorder, width: '2px' },
						bottom: { ...defaultBorder, width: '3px' },
						left: { ...defaultBorder, width: '4px' },
					},
				} );

				clickButton( 'Link sides' );
				updateLinkedWidthInput( '10' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...defaultBorder,
					width: '10px',
				} );
			} );
		} );

		describe( 'Split value change handling', () => {
			it( 'should set split borders when the updated borders are mixed', () => {
				const borders = {
					top: { ...defaultBorder, width: '1px' },
					right: { ...defaultBorder, width: '2px' },
					bottom: { ...defaultBorder, width: '3px' },
					left: { ...defaultBorder, width: '4px' },
				};

				renderBorderBoxControl( { value: borders } );
				updateSplitWidthInput( '5' );

				expect( props.onChange ).toHaveBeenCalledWith( {
					...borders,
					top: { ...defaultBorder, width: '5px' },
				} );
			} );

			it( 'should set flat border when updated borders are consistent', () => {
				const borders = {
					top: { ...defaultBorder, width: '4px' },
					right: { ...defaultBorder, width: '1px' },
					bottom: { ...defaultBorder, width: '1px' },
					left: { ...defaultBorder, width: '1px' },
				};

				renderBorderBoxControl( { value: borders } );
				updateSplitWidthInput( '1' );

				expect( props.onChange ).toHaveBeenCalledWith( defaultBorder );
			} );
		} );
	} );
} );
