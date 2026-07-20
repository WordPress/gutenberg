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
	PanelBody: ( { children, title } ) => (
		<section aria-label={ title }>{ children }</section>
	),
	__experimentalVStack: ( { children } ) => <div>{ children }</div>,
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
		collapsedMenuBreakpoint: '10px',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'explains the breakpoint and allows decimal values for all supported units', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		expect( UnitControl.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				help: 'Below this width, the navigation is collapsed behind a menu button. At this width and wider, links are shown inline.',
				min: 0,
				step: 'any',
				value: '10px',
			} )
		);

		fireEvent.change( screen.getByLabelText( 'Breakpoint' ), {
			target: { value: '37.5rem' },
		} );

		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			collapsedMenuBreakpoint: '37.5rem',
		} );
	} );

	it( 'falls back to the default breakpoint for invalid values', () => {
		render( <OverlayPanel { ...defaultProps } /> );

		fireEvent.change( screen.getByLabelText( 'Breakpoint' ), {
			target: { value: '0px' },
		} );

		expect( defaultProps.setAttributes ).toHaveBeenLastCalledWith( {
			collapsedMenuBreakpoint: '600px',
		} );
	} );
} );
