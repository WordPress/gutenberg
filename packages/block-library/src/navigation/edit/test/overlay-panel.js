/**
 * External dependencies
 */
import { createEvent, fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import OverlayPanel from '../overlay-panel';

jest.mock( '@wordpress/components', () => ( {
	Button: jest.fn( ( { label, onClick } ) => (
		<button aria-label={ label } onClick={ onClick } type="button">
			{ label }
		</button>
	) ),
	PanelBody: ( { children, title } ) => (
		<section aria-label={ title }>{ children }</section>
	),
	__experimentalUnitControl: jest.fn(
		( { help, label, onBlur, onChange, onKeyDown, value } ) => (
			<div>
				<input
					aria-label={ label }
					onBlur={ onBlur }
					onChange={ ( event ) => onChange( event.target.value ) }
					onKeyDown={ onKeyDown }
					value={ value }
				/>
				<span>{ help }</span>
			</div>
		)
	),
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Stack: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '../overlay-template-part-selector', () => () => null );
jest.mock( '../overlay-visibility-control', () => () => null );
jest.mock( '../overlay-menu-preview-button', () => () => null );
jest.mock( '../overlay-preview', () => () => null );

describe( 'OverlayPanel', () => {
	const defaultProps = {
		overlayMenu: 'mobile',
		overlay: undefined,
		setAttributes: jest.fn(),
		onNavigateToEntityRecord: jest.fn(),
		overlayMenuPreview: false,
		setOverlayMenuPreview: jest.fn(),
		hasIcon: true,
		icon: 'menu',
		overlayMenuPreviewClasses: '',
		overlayMenuPreviewId: 'test-preview',
		isResponsive: true,
		currentTheme: 'twentytwentyfive',
		hasOverlays: false,
		overlayBreakpoint: '10px',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'explains the breakpoint and allows decimal values for all supported units', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		expect( UnitControl.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				help: 'Sets the width where navigation items switch from collapsed to inline.',
				label: 'Overlay breakpoint',
				min: 0,
				step: 'any',
				value: '10px',
			} )
		);

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '37.5rem' },
		} );

		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			overlayBreakpoint: '37.5rem',
		} );
	} );

	it( 'does not commit empty or partial values while editing', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '' },
		} );

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '37.' },
		} );

		expect( defaultProps.setAttributes ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( 'Overlay breakpoint' ) ).toHaveValue(
			'37.'
		);
	} );

	// Follow-up: validation UI is intentionally out of scope for this PR.
	// This skipped test documents the desired hardening without expanding the
	// current review beyond the Copilot snap-back fix.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'marks invalid typed values as invalid without saving or normalizing them', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '0px' },
		} );
		fireEvent.blur( screen.getByLabelText( 'Overlay breakpoint' ) );

		expect( defaultProps.setAttributes ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( 'Overlay breakpoint' ) ).toHaveValue(
			'0px'
		);
		expect(
			screen.getByText(
				'Enter a positive breakpoint using px, em, or rem.'
			)
		).toBeVisible();
	} );

	// Follow-up: paste handling needs a dedicated validation implementation.
	// Invalid pasted values should leave the field value untouched, show an
	// error, and avoid applying the value to block attributes.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'marks invalid pasted values as invalid without changing the field value', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		const input = screen.getByLabelText( 'Overlay breakpoint' );
		const pasteEvent = createEvent.paste( input, {
			clipboardData: {
				getData: () => 'not a number',
			},
		} );

		fireEvent( input, pasteEvent );

		expect( pasteEvent.defaultPrevented ).toBe( true );
		expect( input ).toHaveValue( '10px' );
		expect( defaultProps.setAttributes ).not.toHaveBeenCalled();
		expect(
			screen.getByText(
				'Enter a positive breakpoint using px, em, or rem.'
			)
		).toBeVisible();
	} );

	// Follow-up: keyboard filtering should be considered alongside the final
	// validation UI so unsupported characters are handled consistently.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'marks negative breakpoint input as invalid', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		const input = screen.getByLabelText( 'Overlay breakpoint' );
		const keyDownEvent = createEvent.keyDown( input, {
			key: '-',
		} );

		fireEvent( input, keyDownEvent );

		expect( keyDownEvent.defaultPrevented ).toBe( true );
		expect(
			screen.getByText(
				'Enter a positive breakpoint using px, em, or rem.'
			)
		).toBeVisible();
	} );

	it( 'falls back to the default breakpoint for empty values on Enter', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '' },
		} );
		fireEvent.keyDown( screen.getByLabelText( 'Overlay breakpoint' ), {
			key: 'Enter',
		} );

		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			overlayBreakpoint: '600px',
		} );
	} );

	it.each( [ 'never', 'always' ] )(
		'hides the overlay breakpoint control when overlay visibility is %s',
		( overlayMenu ) => {
			render(
				<OverlayPanel { ...defaultProps } overlayMenu={ overlayMenu } />
			);

			expect(
				screen.queryByLabelText( 'Overlay breakpoint' )
			).not.toBeInTheDocument();
			expect( UnitControl ).not.toHaveBeenCalled();
		}
	);

	it( 'resets the breakpoint to the default value and unit', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Reset overlay breakpoint',
			} )
		);

		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			overlayBreakpoint: '600px',
		} );
	} );

	it( 'does not show the reset button for the default breakpoint', () => {
		render(
			<OverlayPanel { ...defaultProps } overlayBreakpoint="600px" />
		);

		expect(
			screen.queryByRole( 'button', {
				name: 'Reset overlay breakpoint',
			} )
		).not.toBeInTheDocument();
	} );
} );
