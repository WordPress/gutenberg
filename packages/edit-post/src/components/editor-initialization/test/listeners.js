/**
 * Internal dependencies
 */
import {
	blockSelectionListener,
	adjustSidebarListener,
	viewPostLinkUpdateListener,
} from '../listeners';
import { STORE_KEY, VIEW_AS_LINK_SELECTOR } from '../../../store/constants';

const registryMock = { select: {}, dispatch: {} };

describe( 'blockSelectionListener', () => {
	const isEditorSidebarOpened = jest.fn();
	const	getBlockSelectionStart = jest.fn();
	const	openSidebar = jest.fn();
	beforeEach( () => {
		registryMock.select = ( store ) => {
			const stores = {
				'core/block-editor': { getBlockSelectionStart },
				'core/edit-post': { isEditorSidebarOpened },
			};
			return stores[ store ];
		};
		registryMock.dispatch = () => ( { openGeneralSidebar: openSidebar } );
	} );
	afterEach( () => {
		isEditorSidebarOpened.mockClear();
		getBlockSelectionStart.mockClear();
		openSidebar.mockClear();
	} );
	it( 'does nothing if sidebar is not opened', () => {
		getBlockSelectionStart.mockReturnValue( true );
		isEditorSidebarOpened.mockReturnValue( false );
		const listener = blockSelectionListener( registryMock );
		getBlockSelectionStart.mockReturnValue( false );
		listener();
		expect( getBlockSelectionStart ).toHaveBeenCalled();
		expect( isEditorSidebarOpened ).toHaveBeenCalled();
		expect( openSidebar ).not.toHaveBeenCalled();
	} );
	it( 'opens block sidebar if block is selected', () => {
		isEditorSidebarOpened.mockReturnValue( true );
		getBlockSelectionStart.mockReturnValue( false );
		const listener = blockSelectionListener( registryMock );
		getBlockSelectionStart.mockReturnValue( true );
		listener();
		expect( openSidebar ).toHaveBeenCalledWith( 'edit-post/block' );
	} );
	it( 'opens document sidebar if block is not selected', () => {
		isEditorSidebarOpened.mockReturnValue( true );
		getBlockSelectionStart.mockReturnValue( true );
		const listener = blockSelectionListener( registryMock );
		getBlockSelectionStart.mockReturnValue( false );
		listener();
		expect( openSidebar ).toHaveBeenCalledWith( 'edit-post/document' );
	} );
} );
describe( 'adjustSidebarListener', () => {
	const isViewportMatch = jest.fn();
	const getActiveGeneralSidebarName = jest.fn();
	const willCloseGeneralSidebar = jest.fn();
	const willOpenGeneralSidebar = jest.fn();
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
				[ STORE_KEY ]: {
					closeGeneralSidebar: willCloseGeneralSidebar,
					openGeneralSidebar: willOpenGeneralSidebar,
				},
			};
			return stores[ store ];
		};
		registryMock.subscribe = jest.fn();
		isViewportMatch.mockReturnValue( true );
	} );
	afterEach( () => {
		isViewportMatch.mockClear();
		getActiveGeneralSidebarName.mockClear();
		willCloseGeneralSidebar.mockClear();
		willOpenGeneralSidebar.mockClear();
	} );
	it( 'initializes and does nothing when viewport is not small', () => {
		isViewportMatch.mockReturnValue( false );
		adjustSidebarListener( registryMock )();
		expect( isViewportMatch ).toHaveBeenCalled();
		expect( getActiveGeneralSidebarName ).not.toHaveBeenCalled();
	} );
	it( 'does not close sidebar if viewport is small and there is no ' +
		'active sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( false );
		adjustSidebarListener( registryMock )();
		expect( willCloseGeneralSidebar ).not.toHaveBeenCalled();
		expect( willOpenGeneralSidebar ).not.toHaveBeenCalled();
	} );
	it( 'closes sidebar if viewport is small and there is an active ' +
		'sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( 'someSidebar' );
		adjustSidebarListener( registryMock )();
		expect( willCloseGeneralSidebar ).toHaveBeenCalled();
		expect( willOpenGeneralSidebar ).not.toHaveBeenCalled();
	} );
	it( 'opens sidebar if viewport is not small, there is a cached sidebar to ' +
		'reopen on expand, and there is no current sidebar name available', () => {
		getActiveGeneralSidebarName.mockReturnValue( 'someSidebar' );
		const listener = adjustSidebarListener( registryMock );
		listener();
		isViewportMatch.mockReturnValue( false );
		getActiveGeneralSidebarName.mockReturnValue( false );
		listener();
		expect( willCloseGeneralSidebar ).toHaveBeenCalledTimes( 1 );
		expect( willOpenGeneralSidebar ).toHaveBeenCalledTimes( 1 );
	} );
} );
describe( 'viewPostLinkUpdateListener', () => {
	const getCurrentPost = jest.fn();
	const setAttribute = jest.fn();
	beforeEach( () => {
		document.querySelector = jest.fn().mockReturnValue( { setAttribute } );
		getCurrentPost.mockReturnValue( { link: 'foo' } );
		registryMock.select = ( store ) => {
			const stores = { 'core/editor': { getCurrentPost } };
			return stores[ store ];
		};
	} );
	afterEach( () => {
		setAttribute.mockClear();
		getCurrentPost.mockClear();
	} );
	it( 'updates nothing if there is no new permalink', () => {
		const listener = viewPostLinkUpdateListener( registryMock );
		listener();
		expect( getCurrentPost ).toHaveBeenCalledTimes( 2 );
		expect( document.querySelector ).not.toHaveBeenCalled();
		expect( setAttribute ).not.toHaveBeenCalled();
	} );
	it( 'does not do anything if the node is not found', () => {
		const listener = viewPostLinkUpdateListener( registryMock );
		getCurrentPost.mockReturnValue( { link: 'bar' } );
		document.querySelector.mockReturnValue( false );
		listener();
		expect( document.querySelector )
			.toHaveBeenCalledWith( VIEW_AS_LINK_SELECTOR );
		expect( setAttribute ).not.toHaveBeenCalled();
	} );
	it( 'updates with the new permalink when node is found', () => {
		const listener = viewPostLinkUpdateListener( registryMock );
		getCurrentPost.mockReturnValue( { link: 'bar' } );
		listener();
		expect( setAttribute ).toHaveBeenCalledWith( 'href', 'bar' );
	} );
} );
