/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import useDashboardLayout from '../use-dashboard-layout/use-dashboard-layout';
import type { DashboardWidget } from '../../widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';

const SAMPLE_LAYOUT: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/quick-draft' },
	{ uuid: 'b', type: 'core/at-a-glance' },
];

describe( 'useDashboardLayout', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, undefined );
	} );

	it( 'returns an empty array when nothing is persisted', () => {
		const { result } = renderHook( () => useDashboardLayout() );
		const [ layout ] = result.current;
		expect( layout ).toEqual( [] );
	} );

	it( 'persists updates written through setLayout', () => {
		const { result } = renderHook( () => useDashboardLayout() );

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'reads the layout written from outside the hook', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, SAMPLE_LAYOUT );

		const { result } = renderHook( () => useDashboardLayout() );
		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'clears the layout via resetLayout', () => {
		const { result } = renderHook( () => useDashboardLayout() );

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		act( () => {
			const [ , , resetLayout ] = result.current;
			resetLayout();
		} );

		const [ layout ] = result.current;
		expect( layout ).toEqual( [] );
	} );
} );
