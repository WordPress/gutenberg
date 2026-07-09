/**
 * Internal dependencies
 */
import { getBlockToolbarSlotVisibility } from '../';

describe( 'getBlockToolbarSlotVisibility', () => {
	it( 'shows all toolbar slots by default', () => {
		expect(
			getBlockToolbarSlotVisibility( {
				isZoomOut: false,
				isEditingResponsiveStyleState: false,
			} )
		).toEqual( {
			showSlots: true,
			showStyleStateSlot: false,
		} );
	} );

	it( 'shows only the style-state slot while editing a responsive style state', () => {
		expect(
			getBlockToolbarSlotVisibility( {
				isZoomOut: false,
				isEditingResponsiveStyleState: true,
			} )
		).toEqual( {
			showSlots: false,
			showStyleStateSlot: true,
		} );
	} );

	it( 'hides toolbar slots while zoomed out', () => {
		expect(
			getBlockToolbarSlotVisibility( {
				isZoomOut: true,
				isEditingResponsiveStyleState: true,
			} )
		).toEqual( {
			showSlots: false,
			showStyleStateSlot: false,
		} );
	} );
} );
