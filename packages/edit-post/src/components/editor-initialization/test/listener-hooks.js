/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { RegistryProvider, createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useUpdatePostLinkListener } from '../listener-hooks';
import { STORE_NAME } from '../../../store/constants';

describe( 'listener hook tests', () => {
	const storeConfig = {
		actions: {
			forceUpdate: jest.fn( () => ( { type: 'FORCE_UPDATE' } ) ),
		},
		reducer: ( state = {}, action ) =>
			action.type === 'FORCE_UPDATE' ? { ...state } : state,
	};
	const mockStores = {
		'core/block-editor': {
			...storeConfig,
			selectors: {
				getBlockSelectionStart: jest.fn(),
			},
		},
		'core/editor': {
			...storeConfig,
			selectors: {
				getCurrentPost: jest.fn(),
			},
		},
		'core/viewport': {
			...storeConfig,
			selectors: {
				isViewportMatch: jest.fn(),
			},
		},
		'core/preferences': {
			...storeConfig,
			selectors: {
				get: jest.fn(),
			},
		},
		[ STORE_NAME ]: {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				openGeneralSidebar: jest.fn( () => ( {
					type: 'OPEN_GENERAL_SIDEBAR',
				} ) ),
				closeGeneralSidebar: jest.fn( () => ( {
					type: 'CLOSE_GENERAL_SIDEBAR',
				} ) ),
			},
			selectors: {
				isEditorSidebarOpened: jest.fn(),
				getActiveGeneralSidebarName: jest.fn(),
			},
		},
	};

	const setMockReturnValue = ( store, functionName, value ) => {
		mockStores[ store ].selectors[ functionName ].mockReturnValue( value );
	};

	afterEach( () => {
		Object.values( mockStores ).forEach( ( storeMocks ) => {
			Object.values( storeMocks.selectors ).forEach( ( mock ) => {
				mock.mockClear();
			} );
			Object.values( storeMocks.actions || {} ).forEach( ( mock ) => {
				mock.mockClear();
			} );
		} );
	} );

	describe( 'useUpdatePostLinkListener', () => {
		const registry = createRegistry( mockStores );
		const TestComponent = () => {
			useUpdatePostLinkListener();
			return null;
		};
		const TestedOutput = () => {
			return (
				<RegistryProvider value={ registry }>
					<TestComponent />
				</RegistryProvider>
			);
		};

		const setAttribute = jest.fn();
		const mockSelector = jest.fn();
		beforeEach( () => {
			// eslint-disable-next-line testing-library/no-node-access
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
			render( <TestedOutput /> );

			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'updates nothing if there is no permalink', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', { link: '' } );
			render( <TestedOutput /> );

			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'only calls document query selector once across renders', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			const { rerender } = render( <TestedOutput /> );

			rerender( <TestedOutput /> );

			expect( mockSelector ).toHaveBeenCalledTimes( 1 );
			act( () => {
				registry.dispatch( 'core/editor' ).forceUpdate();
			} );
			expect( mockSelector ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'only updates the permalink when it changes', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			render( <TestedOutput /> );
			expect( setAttribute ).toHaveBeenCalledTimes( 1 );
			act( () => {
				registry.dispatch( 'core/editor' ).forceUpdate();
			} );
			expect( setAttribute ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'updates the permalink when it changes', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			render( <TestedOutput /> );
			expect( setAttribute ).toHaveBeenCalledTimes( 1 );
			expect( setAttribute ).toHaveBeenCalledWith( 'href', 'foo' );

			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'bar',
			} );
			act( () => {
				registry.dispatch( 'core/editor' ).forceUpdate();
			} );
			expect( setAttribute ).toHaveBeenCalledTimes( 2 );
			expect( setAttribute ).toHaveBeenCalledWith( 'href', 'bar' );
		} );
	} );
} );
