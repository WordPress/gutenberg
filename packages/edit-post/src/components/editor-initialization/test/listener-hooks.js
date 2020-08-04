/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	useBlockSelectionListener,
	useUpdatePostLinkListener,
} from '../listener-hooks';
import { STORE_KEY } from '../../../store/constants';

describe( 'listener hook tests', () => {
	const mockStores = {
		'core/block-editor': {
			getBlockSelectionStart: jest.fn(),
		},
		'core/editor': {
			getCurrentPost: jest.fn(),
		},
		'core/viewport': {
			isViewportMatch: jest.fn(),
		},
		[ STORE_KEY ]: {
			isEditorSidebarOpened: jest.fn(),
			openGeneralSidebar: jest.fn(),
			closeGeneralSidebar: jest.fn(),
			getActiveGeneralSidebarName: jest.fn(),
		},
	};
	let subscribeTrigger;
	const registry = {
		select: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		dispatch: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		subscribe: ( subscription ) => {
			subscribeTrigger = subscription;
		},
	};
	const setMockReturnValue = ( store, functionName, value ) => {
		mockStores[ store ][ functionName ] = jest
			.fn()
			.mockReturnValue( value );
	};
	const getSpyedFunction = ( store, functionName ) =>
		mockStores[ store ][ functionName ];
	const renderComponent = ( testedHook, id, renderer = null ) => {
		const TestComponent = ( { postId } ) => {
			testedHook( postId );
			return null;
		};
		const TestedOutput = (
			<RegistryProvider value={ registry }>
				<TestComponent postId={ id } />
			</RegistryProvider>
		);
		return renderer === null
			? TestRenderer.create( TestedOutput )
			: renderer.update( TestedOutput );
	};
	afterEach( () => {
		Object.values( mockStores ).forEach( ( storeMocks ) => {
			Object.values( storeMocks ).forEach( ( mock ) => {
				mock.mockClear();
			} );
		} );
		subscribeTrigger = undefined;
	} );
	describe( 'useBlockSelectionListener', () => {
		it( 'does nothing when editor sidebar is not open', () => {
			setMockReturnValue( STORE_KEY, 'isEditorSidebarOpened', false );
			act( () => {
				renderComponent( useBlockSelectionListener, 10 );
			} );
			expect(
				getSpyedFunction( STORE_KEY, 'isEditorSidebarOpened' )
			).toHaveBeenCalled();
			expect(
				getSpyedFunction( STORE_KEY, 'openGeneralSidebar' )
			).toHaveBeenCalledTimes( 0 );
		} );
		it( 'opens block sidebar if block is selected', () => {
			setMockReturnValue( STORE_KEY, 'isEditorSidebarOpened', true );
			setMockReturnValue(
				'core/block-editor',
				'getBlockSelectionStart',
				true
			);
			act( () => {
				renderComponent( useBlockSelectionListener, 10 );
			} );
			expect(
				getSpyedFunction( STORE_KEY, 'openGeneralSidebar' )
			).toHaveBeenCalledWith( 'edit-post/block' );
		} );
		it( 'opens document sidebar if block is not selected', () => {
			setMockReturnValue( STORE_KEY, 'isEditorSidebarOpened', true );
			setMockReturnValue(
				'core/block-editor',
				'getBlockSelectionStart',
				false
			);
			act( () => {
				renderComponent( useBlockSelectionListener, 10 );
			} );
			expect(
				getSpyedFunction( STORE_KEY, 'openGeneralSidebar' )
			).toHaveBeenCalledWith( 'edit-post/document' );
		} );
	} );

	describe( 'useUpdatePostLinkListener', () => {
		const setAttribute = jest.fn();
		const mockSelector = jest.fn();
		beforeEach( () => {
			document.querySelector = mockSelector.mockReturnValue( {
				setAttribute,
			} );
		} );
		afterEach( () => {
			setAttribute.mockClear();
			mockSelector.mockClear();
		} );
		it( 'updates nothing if there is no view link available', () => {
			mockSelector.mockImplementation( () => null );
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			act( () => {
				renderComponent( useUpdatePostLinkListener, 10 );
			} );
			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'updates nothing if there is no permalink', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', { link: '' } );
			act( () => {
				renderComponent( useUpdatePostLinkListener, 10 );
			} );
			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'only calls document query selector once across renders', () => {
			act( () => {
				const renderer = renderComponent(
					useUpdatePostLinkListener,
					10
				);
				renderComponent( useUpdatePostLinkListener, 20, renderer );
			} );
			expect( mockSelector ).toHaveBeenCalledTimes( 1 );
			act( () => {
				subscribeTrigger();
			} );
			expect( mockSelector ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'only updates the permalink when it changes', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			act( () => {
				renderComponent( useUpdatePostLinkListener, 10 );
			} );
			act( () => {
				subscribeTrigger();
			} );
			expect( setAttribute ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'updates the permalink when it changes', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			act( () => {
				renderComponent( useUpdatePostLinkListener, 10 );
			} );
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'bar',
			} );
			act( () => {
				subscribeTrigger();
			} );
			expect( setAttribute ).toHaveBeenCalledTimes( 2 );
			expect( setAttribute ).toHaveBeenCalledWith( 'href', 'bar' );
		} );
	} );
} );
