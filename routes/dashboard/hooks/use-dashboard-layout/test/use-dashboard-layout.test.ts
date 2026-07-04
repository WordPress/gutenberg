/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Internal dependencies
 */
import { useDashboardLayout } from '../';

jest.mock( '@wordpress/api-fetch' );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';
const DASHBOARD_NAME = 'gutenberg_dashboard';

const SAMPLE_LAYOUT: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/quick-draft' },
	{ uuid: 'b', type: 'core/at-a-glance' },
];

const DEFAULT_LAYOUT: DashboardWidget[] = [
	{ uuid: 'default-hello-world-widget-instance', type: 'core/hello-world' },
];

describe( 'useDashboardLayout', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, undefined );
		mockedApiFetch.mockReset();
	} );

	it( 'returns an empty array when nothing is persisted', () => {
		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);
		const [ layout ] = result.current;
		expect( layout ).toEqual( [] );
	} );

	it( 'persists updates written through setLayout', () => {
		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'reads the layout written from outside the hook', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, SAMPLE_LAYOUT );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);
		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'restores the registered default via resetLayout', async () => {
		mockedApiFetch.mockResolvedValueOnce( DEFAULT_LAYOUT );

		const { result } = renderHook( () =>
			useDashboardLayout( DASHBOARD_NAME )
		);

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		await act( async () => {
			const [ , , resetLayout ] = result.current;
			await resetLayout();
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/dashboards/${ DASHBOARD_NAME }/default-layout`,
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( DEFAULT_LAYOUT );
	} );
} );
