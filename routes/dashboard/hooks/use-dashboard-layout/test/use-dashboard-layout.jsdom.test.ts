import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import type {
	DashboardWidget,
	LayoutGeometry,
} from '@wordpress/widget-dashboard';
import { useDashboardLayout } from '../';

// The package pulls `@wordpress/viewport`, which queries `matchMedia` on
// import.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockedApiFetch = vi.mocked( apiFetch );

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';
const LEGACY_SETTINGS_KEY = 'dashboardGridSettings';
const DASHBOARD_NAME = 'gutenberg_dashboard';

const GEOMETRY: LayoutGeometry = { columns: 4, rowHeight: 40 };
const LEGACY: LayoutGeometry = { columns: 4, rowHeight: 300 };

function placed(
	uuid: string,
	placement: DashboardWidget[ 'placement' ]
): DashboardWidget {
	return { uuid, type: 'core/quick-draft', placement };
}

const SAMPLE_LAYOUT: DashboardWidget[] = [
	placed( 'a', { width: 2, height: 15 } ),
	placed( 'b', { width: 1, height: 5 } ),
];

function render() {
	return renderHook( () => useDashboardLayout( DASHBOARD_NAME, GEOMETRY ) );
}

describe( 'useDashboardLayout', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, undefined );
		dispatch( preferencesStore ).set(
			SCOPE,
			LEGACY_SETTINGS_KEY,
			undefined
		);
		mockedApiFetch.mockReset();
	} );

	it( 'returns an empty array when nothing is persisted', () => {
		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( [] );
	} );

	it( 'persists the layout with the geometry it was saved under', () => {
		const { result } = render();

		act( () => {
			const [ , setLayout ] = result.current;
			setLayout( SAMPLE_LAYOUT );
		} );

		expect( select( preferencesStore ).get( SCOPE, KEY ) ).toEqual( {
			geometry: GEOMETRY,
			widgets: SAMPLE_LAYOUT,
		} );
		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'reads a record written from outside the hook', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			geometry: GEOMETRY,
			widgets: SAMPLE_LAYOUT,
		} );

		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( SAMPLE_LAYOUT );
	} );

	it( 'rescales a record saved under another geometry', () => {
		// Three 300px rows and two 24px gaps are 948px: fifteen 40px rows.
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			geometry: LEGACY,
			widgets: [ placed( 'a', { width: 2, height: 3 } ) ],
		} );

		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( [ placed( 'a', { width: 2, height: 15 } ) ] );
	} );

	it( 'reads a plain array as saved under four columns of 300px rows', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			placed( 'a', { width: 'full', height: 1 } ),
		] );

		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( [
			placed( 'a', { width: 'full', height: 5 } ),
		] );
	} );

	it( 'reads a plain array with the row height the drawer persisted', () => {
		// 220px snaps to the 200px preset: two rows and a gap are 424px,
		// seven 40px rows.
		dispatch( preferencesStore ).set( SCOPE, LEGACY_SETTINGS_KEY, {
			model: 'grid',
			columns: 4,
			rowHeight: 220,
		} );
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			placed( 'a', { width: 1, height: 2 } ),
		] );

		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( [ placed( 'a', { width: 1, height: 7 } ) ] );
	} );

	it( 'leaves a record with an unreadable stamp as it is', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			geometry: { columns: 'four', rowHeight: 300 },
			widgets: [ placed( 'a', { width: 2, height: 3 } ) ],
		} );

		const { result } = render();
		const [ layout ] = result.current;
		expect( layout ).toEqual( [ placed( 'a', { width: 2, height: 3 } ) ] );
	} );

	it( 'restores the registered default via resetLayout', async () => {
		mockedApiFetch.mockResolvedValueOnce( [
			placed( 'default', { width: 3, height: 3 } ),
		] );

		const { result } = render();

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

		// The default is authored on 300px rows and lands in the current
		// geometry, stamped with it.
		const expected = [ placed( 'default', { width: 3, height: 15 } ) ];
		expect( select( preferencesStore ).get( SCOPE, KEY ) ).toEqual( {
			geometry: GEOMETRY,
			widgets: expected,
		} );
		const [ layout ] = result.current;
		expect( layout ).toEqual( expected );
	} );
} );
