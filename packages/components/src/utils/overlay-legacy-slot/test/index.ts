/**
 * Internal dependencies
 */
import { getOverlayLegacySlot, OVERLAY_LEGACY_SLOT_CLASSNAME } from '..';

describe( 'getOverlayLegacySlot', () => {
	afterEach( () => {
		document.body
			.querySelectorAll( `.${ OVERLAY_LEGACY_SLOT_CLASSNAME }` )
			.forEach( ( element ) => element.remove() );
	} );

	it( 'lazily creates a slot element on first call and appends it to the document body', () => {
		expect(
			document.body.querySelector( `.${ OVERLAY_LEGACY_SLOT_CLASSNAME }` )
		).toBeNull();

		const slot = getOverlayLegacySlot();

		expect( slot ).toBeInstanceOf( HTMLDivElement );
		expect( slot ).toHaveClass( OVERLAY_LEGACY_SLOT_CLASSNAME );
		expect( slot.parentElement ).toBe( document.body );
	} );

	it( 'caches the singleton across calls', () => {
		const first = getOverlayLegacySlot();
		const second = getOverlayLegacySlot();

		expect( second ).toBe( first );
		expect(
			document.body.querySelectorAll(
				`.${ OVERLAY_LEGACY_SLOT_CLASSNAME }`
			)
		).toHaveLength( 1 );
	} );

	it( 'reuses an existing slot element already present in the DOM', () => {
		const preexisting = document.createElement( 'div' );
		preexisting.className = OVERLAY_LEGACY_SLOT_CLASSNAME;
		document.body.append( preexisting );

		const slot = getOverlayLegacySlot();

		expect( slot ).toBe( preexisting );
	} );

	it( 'recreates the slot if the cached element has been detached', () => {
		const first = getOverlayLegacySlot();
		first.remove();

		const second = getOverlayLegacySlot();

		expect( second ).not.toBe( first );
		expect( second.isConnected ).toBe( true );
		expect( second.parentElement ).toBe( document.body );
	} );
} );
