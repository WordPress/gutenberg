/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { BorderControl } from '../';

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

const props = {
	colors,
	label: 'Border',
	onChange: jest.fn().mockImplementation( ( newValue ) => {
		props.value = newValue;
	} ),
	value: defaultBorder,
};

const renderBorderControl = ( customProps ) => {
	return render( <BorderControl { ...{ ...props, ...customProps } } /> );
};

const rerenderBorderControl = ( rerender, customProps ) => {
	return rerender( <BorderControl { ...{ ...props, ...customProps } } /> );
};

const openPopover = ( dropdownToggle ) => {
	const toggleButton =
		dropdownToggle || screen.getByLabelText( 'Open border options' );
	fireEvent.click( toggleButton );
};

const getButton = ( name ) => {
	return screen.getByRole( 'button', { name } );
};

const queryButton = ( name ) => {
	return screen.queryByRole( 'button', { name } );
};

const clickButton = ( name ) => {
	fireEvent.click( getButton( name ) );
};

const setWidthInput = ( value ) => {
	const widthInput = screen.getByRole( 'spinbutton' );
	widthInput.focus();
	fireEvent.change( widthInput, { target: { value } } );
};

const clearWidthInput = () => setWidthInput( '' );

describe( 'BorderControl', () => {
	describe( 'basic rendering', () => {
		it( 'should render standard border control', () => {
			renderBorderControl();

			const label = screen.getByText( props.label );
			const colorButton = screen.getByLabelText( 'Open border options' );
			const widthInput = screen.getByRole( 'spinbutton' );
			const unitSelect = screen.getByRole( 'combobox' );
			const slider = screen.queryByRole( 'slider' );

			expect( label ).toBeInTheDocument();
			expect( colorButton ).toBeInTheDocument();
			expect( widthInput ).toBeInTheDocument();
			expect( unitSelect ).toBeInTheDocument();
			expect( slider ).not.toBeInTheDocument();
		} );

		it( 'should hide label', () => {
			renderBorderControl( { hideLabelFromVision: true } );
			const label = screen.getByText( props.label );

			// As visually hidden labels are still included in the document
			// and do not have `display: none` styling, we can't rely on
			// `.toBeInTheDocument()` or `.toBeVisible()` assertions.
			expect( label ).toHaveAttribute(
				'data-wp-component',
				'VisuallyHidden'
			);
		} );

		it( 'should render with slider', () => {
			renderBorderControl( { withSlider: true } );

			const slider = screen.getByRole( 'slider' );
			expect( slider ).toBeInTheDocument();
		} );

		it( 'should render placeholder in UnitControl', () => {
			renderBorderControl( { placeholder: 'Mixed' } );
			const widthInput = screen.getByRole( 'spinbutton' );

			expect( widthInput ).toHaveAttribute( 'placeholder', 'Mixed' );
		} );

		it( 'should render color and style popover', () => {
			renderBorderControl();
			openPopover();

			const headerLabel = screen.getByText( 'Border color' );
			const closeButton = getButton( 'Close border color' );
			const customColorPicker = getButton( 'Custom color picker' );
			const colorSwatchButtons = screen.getAllByRole( 'button', {
				name: /^Color:/,
			} );
			const styleLabel = screen.getByText( 'Style' );
			const solidButton = getButton( 'Solid' );
			const dashedButton = getButton( 'Dashed' );
			const dottedButton = getButton( 'Dotted' );
			const resetButton = getButton( 'Reset to default' );

			expect( headerLabel ).toBeInTheDocument();
			expect( closeButton ).toBeInTheDocument();
			expect( customColorPicker ).toBeInTheDocument();
			expect( colorSwatchButtons.length ).toEqual( colors.length );
			expect( styleLabel ).toBeInTheDocument();
			expect( solidButton ).toBeInTheDocument();
			expect( dashedButton ).toBeInTheDocument();
			expect( dottedButton ).toBeInTheDocument();
			expect( resetButton ).toBeInTheDocument();
		} );

		it( 'should not render style options when opted out of', () => {
			renderBorderControl( { enableStyle: false } );
			openPopover();

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

	describe( 'onChange handling', () => {
		beforeEach( () => {
			jest.clearAllMocks();
			props.value = defaultBorder;
		} );

		it( 'should update width with slider value', () => {
			const { rerender } = renderBorderControl( { withSlider: true } );

			const slider = screen.getByRole( 'slider' );
			fireEvent.change( slider, { target: { value: '5' } } );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, {
				...defaultBorder,
				width: '5px',
			} );

			rerenderBorderControl( rerender, { withSlider: true } );
			const widthInput = screen.getByRole( 'spinbutton' );

			expect( widthInput.value ).toEqual( '5' );
		} );

		it( 'should update color selection', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Color: Green' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, {
				...defaultBorder,
				color: '#00a32a',
			} );
		} );

		it( 'should clear color selection when toggling swatch off', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Color: Blue' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, {
				...defaultBorder,
				color: undefined,
			} );
		} );

		it( 'should update style selection', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Dashed' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, {
				...defaultBorder,
				style: 'dashed',
			} );
		} );

		it( 'should take no action when color and style popover is closed', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Close border color' );

			expect( props.onChange ).not.toHaveBeenCalled();
		} );

		it( 'should reset color and style only when popover reset button clicked', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Reset to default' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, {
				color: undefined,
				style: undefined,
				width: defaultBorder.width,
			} );
		} );

		it( 'should sanitize border when width and color are undefined', () => {
			const { rerender } = renderBorderControl();
			clearWidthInput();
			rerenderBorderControl( rerender );
			openPopover();
			clickButton( 'Color: Blue' );

			expect( props.onChange ).toHaveBeenCalledWith( undefined );
		} );

		it( 'should not sanitize border when requested', () => {
			const { rerender } = renderBorderControl( {
				shouldSanitizeBorder: false,
			} );
			clearWidthInput();
			rerenderBorderControl( rerender, { shouldSanitizeBorder: false } );
			openPopover();
			clickButton( 'Color: Blue' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 2, {
				color: undefined,
				style: defaultBorder.style,
				width: undefined,
			} );
		} );

		it( 'should clear color and set style to `none` when setting zero width', () => {
			renderBorderControl();
			openPopover();
			clickButton( 'Color: Green' );
			clickButton( 'Dotted' );
			setWidthInput( '0' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 3, {
				color: undefined,
				style: 'none',
				width: '0px',
			} );
		} );

		it( 'should reselect color and style selections when changing to non-zero width', () => {
			const { rerender } = renderBorderControl();
			openPopover();
			clickButton( 'Color: Green' );
			rerenderBorderControl( rerender );
			clickButton( 'Dotted' );
			rerenderBorderControl( rerender );
			setWidthInput( '0' );
			setWidthInput( '5' );

			expect( props.onChange ).toHaveBeenNthCalledWith( 4, {
				color: '#00a32a',
				style: 'dotted',
				width: '5px',
			} );
		} );

		it( 'should set a non-zero width when applying color to zero width border', () => {
			const { rerender } = renderBorderControl( { value: undefined } );
			openPopover();
			clickButton( 'Color: Yellow' );

			expect( props.onChange ).toHaveBeenCalledWith( {
				color: '#bd8600',
				style: undefined,
				width: undefined,
			} );

			setWidthInput( '0' );
			rerenderBorderControl( rerender );
			clickButton( 'Color: Green' );

			expect( props.onChange ).toHaveBeenCalledWith( {
				color: '#00a32a',
				style: undefined,
				width: '1px',
			} );
		} );

		it( 'should set a non-zero width when applying style to zero width border', () => {
			const { rerender } = renderBorderControl( {
				value: undefined,
				shouldSanitizeBorder: false,
			} );
			openPopover();
			clickButton( 'Dashed' );

			expect( props.onChange ).toHaveBeenCalledWith( {
				color: undefined,
				style: 'dashed',
				width: undefined,
			} );

			setWidthInput( '0' );
			rerenderBorderControl( rerender, { shouldSanitizeBorder: false } );
			clickButton( 'Dotted' );

			expect( props.onChange ).toHaveBeenCalledWith( {
				color: undefined,
				style: 'dotted',
				width: '1px',
			} );
		} );
	} );
} );
