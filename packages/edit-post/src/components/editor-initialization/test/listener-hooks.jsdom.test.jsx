import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { useUpdatePostLinkListener } from '../listener-hooks';
import { STORE_NAME } from '../../../store/constants';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'listener hook tests', () => {
	const storeConfig = {
		actions: {
			forceUpdate: vi.fn( () => ( { type: 'FORCE_UPDATE' } ) ),
		},
		reducer: ( state = {}, action ) =>
			action.type === 'FORCE_UPDATE' ? { ...state } : state,
	};
	const mockStores = {
		'core/block-editor': {
			...storeConfig,
			selectors: {
				getBlockSelectionStart: vi.fn(),
			},
		},
		'core/editor': {
			...storeConfig,
			selectors: {
				getCurrentPost: vi.fn(),
				getCurrentPostType: vi.fn(),
				getEditedPostAttribute: vi.fn(),
			},
		},
		core: {
			...storeConfig,
			selectors: {
				getPostType: vi.fn(),
			},
		},
		'core/viewport': {
			...storeConfig,
			selectors: {
				isViewportMatch: vi.fn(),
			},
		},
		'core/preferences': {
			...storeConfig,
			selectors: {
				get: vi.fn(),
			},
		},
		[ STORE_NAME ]: {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				openGeneralSidebar: vi.fn( () => ( {
					type: 'OPEN_GENERAL_SIDEBAR',
				} ) ),
				closeGeneralSidebar: vi.fn( () => ( {
					type: 'CLOSE_GENERAL_SIDEBAR',
				} ) ),
			},
			selectors: {
				isEditorSidebarOpened: vi.fn(),
				getActiveGeneralSidebarName: vi.fn(),
			},
		},
	};

	const setMockReturnValue = ( store, functionName, value ) => {
		mockStores[ store ].selectors[ functionName ].mockReturnValue( value );
	};

	const setupPostTypeScenario = ( postType, isViewable = true ) => {
		setMockReturnValue( 'core/editor', 'getEditedPostAttribute', postType );
		setMockReturnValue( 'core', 'getPostType', {
			viewable: isViewable,
		} );
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

		const setAttribute = vi.fn();
		const mockElement = {
			setAttribute,
			style: { display: '' },
		};
		const mockSelector = vi.fn();
		beforeEach( () => {
			// Reset the mock element style
			mockElement.style.display = '';
			// eslint-disable-next-line testing-library/no-node-access
			document.querySelector =
				mockSelector.mockReturnValue( mockElement );
		} );
		afterEach( () => {
			setAttribute.mockClear();
			mockSelector.mockClear();
			mockElement.style.display = '';
		} );
		it( 'updates nothing if there is no view link available', () => {
			mockSelector.mockImplementation( () => null );
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			setupPostTypeScenario( 'post', true );
			render( <TestedOutput /> );

			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'updates nothing if there is no permalink', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', { link: '' } );
			setupPostTypeScenario( 'post', true );
			render( <TestedOutput /> );

			expect( setAttribute ).not.toHaveBeenCalled();
		} );
		it( 'only calls document query selector once across renders', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			setupPostTypeScenario( 'post', true );
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
			setupPostTypeScenario( 'post', true );
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
			setupPostTypeScenario( 'post', true );
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
		it( 'hides the "View Post" link when editing non-viewable post types', () => {
			setMockReturnValue( 'core/editor', 'getCurrentPost', {
				link: 'foo',
			} );
			setupPostTypeScenario( 'wp_block', false );
			render( <TestedOutput /> );

			expect( setAttribute ).not.toHaveBeenCalled();
			expect( mockElement ).toHaveProperty( 'style.display', 'none' );
		} );
	} );
} );
