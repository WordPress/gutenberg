/**
 * Internal dependencies
 */
import controls from '../controls';
import { STORE_KEY } from '../constants';

describe( 'ADJUST_SIDEBAR control behaviour', () => {
	const control = controls.ADJUST_SIDEBAR;
	const registryMock = { select: {}, dispatch: {}, subscribe: {} };
	const isViewportMatch = jest.fn();
	const getActiveGeneralSidebarName = jest.fn();
	const closeGeneralSidebar = jest.fn();
	const openGeneralSidebar = jest.fn();
	beforeEach( () => {
		registryMock.select = ( store ) => {
			const stores = {
				'core/viewport': { isViewportMatch },
				[ STORE_KEY ]: { getActiveGeneralSidebarName },
			};
			return stores[ store ];
		};
		registryMock.dispatch = ( store ) => {
			const stores = {
				[ STORE_KEY ]: { closeGeneralSidebar, openGeneralSidebar },
			};
			return stores[ store ];
		};
		registryMock.subscribe = jest.fn();
		isViewportMatch.mockReturnValue( true );
	} );
	afterEach( () => {
		isViewportMatch.mockClear();
		getActiveGeneralSidebarName.mockClear();
		closeGeneralSidebar.mockClear();
		openGeneralSidebar.mockClear();
	} );
	it( 'initializes and does nothing when viewport is not small', () => {
		isViewportMatch.mockReturnValue( false );
		control( registryMock )();
		expect( isViewportMatch ).toHaveBeenCalled();
		expect( getActiveGeneralSidebarName ).not.toHaveBeenCalled();
		expect( registryMock.subscribe ).toHaveBeenCalled();
	} );
	it( 'does not close sidebar if viewport is small and there is no ' +
		'active sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( false );
		control( registryMock )();
		expect( closeGeneralSidebar ).not.toHaveBeenCalled();
		expect( openGeneralSidebar ).not.toHaveBeenCalled();
	} );
	it( 'closes sidebar if viewport is small and there is an active ' +
		'sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( 'someSidebar' );
		control( registryMock )();
		expect( closeGeneralSidebar ).toHaveBeenCalled();
		expect( openGeneralSidebar ).not.toHaveBeenCalled();
	} );
	it( 'opens sidebar if viewport is not small, there is a cached sidebar to ' +
		'reopen on expand, and there is no current sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( 'someSidebar' );
		control( registryMock )();
		const listener = registryMock.subscribe.mock.calls[ 0 ][ 0 ];
		isViewportMatch.mockReturnValue( false );
		getActiveGeneralSidebarName.mockReturnValue( false );
		listener();
		expect( closeGeneralSidebar ).toHaveBeenCalledTimes( 1 );
		expect( openGeneralSidebar ).toHaveBeenCalledTimes( 1 );
	} );
} );

