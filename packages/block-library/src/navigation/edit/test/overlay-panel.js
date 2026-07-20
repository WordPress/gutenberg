/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

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
		( { help, label, onChange, value } ) => (
			<div>
				<input
					aria-label={ label }
					onChange={ ( event ) => onChange( event.target.value ) }
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

	it( 'falls back to the default breakpoint for invalid values', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.change( screen.getByLabelText( 'Overlay breakpoint' ), {
			target: { value: '0px' },
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
