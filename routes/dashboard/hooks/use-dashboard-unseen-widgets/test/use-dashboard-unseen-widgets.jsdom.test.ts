import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted( () => {
	if ( typeof window !== 'undefined' && ! window.matchMedia ) {
		Object.defineProperty( window, 'matchMedia', {
			writable: true,
			value: ( query: string ) => ( {
				matches: false,
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			} ),
		} );
	}
} );

import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardUnseenWidgets, KEY, SCOPE } from '../';

const BASE_WIDGET_TYPES: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'core/quick-draft',
		title: 'Quick Draft',
		renderModule: 'wp/widgets/quick-draft/render',
		presence: 'offer',
		provenance: 'core',
	},
	{
		apiVersion: 1,
		name: 'core/site-health',
		title: 'Site Health',
		renderModule: 'wp/widgets/site-health/render',
		presence: 'offer',
		provenance: 'core',
	},
];

const NEW_OFFER_WIDGET: WidgetType = {
	apiVersion: 1,
	name: 'my-plugin/analytics',
	title: 'Store Analytics',
	renderModule: 'plugin/analytics/render',
	presence: 'offer',
	provenance: 'My Plugin',
};

const NEW_AUTO_WIDGET: WidgetType = {
	apiVersion: 1,
	name: 'classic-plugin/box',
	title: 'Classic Box',
	renderModule: 'classic/box/render',
	presence: 'auto',
	provenance: 'Classic Plugin',
};

describe( 'useDashboardUnseenWidgets', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, undefined );
		const existingNotices = select( noticesStore ).getNotices();
		for ( const notice of existingNotices ) {
			dispatch( noticesStore ).removeNotice( notice.id );
		}
	} );

	it( 'seeds knownWidgetTypes on first visit without creating notices', () => {
		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: BASE_WIDGET_TYPES,
				isResolvingWidgetTypes: false,
				layout,
				onLayoutChange,
			} )
		);

		const known = select( preferencesStore ).get( SCOPE, KEY );
		expect( known ).toEqual( [ 'core/quick-draft', 'core/site-health' ] );
		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );

	it( 'does nothing while widget types are still resolving', () => {
		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: BASE_WIDGET_TYPES,
				isResolvingWidgetTypes: true,
				layout,
				onLayoutChange,
			} )
		);

		const known = select( preferencesStore ).get( SCOPE, KEY );
		expect( known ).toBeUndefined();
	} );

	it( 'announces unseen widget type with offer presence and adds it to known types', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			'core/quick-draft',
			'core/site-health',
		] );

		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: [ ...BASE_WIDGET_TYPES, NEW_OFFER_WIDGET ],
				isResolvingWidgetTypes: false,
				layout,
				onLayoutChange,
			} )
		);

		const notices = select( noticesStore ).getNotices();
		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ].id ).toBe( 'new-widget-type-my-plugin/analytics' );
		expect( notices[ 0 ].content ).toContain( 'My Plugin' );
		expect( notices[ 0 ].content ).toContain( 'Store Analytics' );

		const actions = notices[ 0 ].actions;
		expect( actions ).toHaveLength( 2 );
		expect( actions[ 0 ].label ).toBe( 'Insert' );
		expect( actions[ 1 ].label ).toBe( 'Ignore' );

		const known = select( preferencesStore ).get( SCOPE, KEY );
		expect( known ).toEqual( [
			'core/quick-draft',
			'core/site-health',
			'my-plugin/analytics',
		] );

		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );

	it( 'inserts widget when clicking Insert on offer notice', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			'core/quick-draft',
			'core/site-health',
		] );

		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [
			{ uuid: 'w1', type: 'core/quick-draft' },
		];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: [ ...BASE_WIDGET_TYPES, NEW_OFFER_WIDGET ],
				isResolvingWidgetTypes: false,
				layout,
				onLayoutChange,
			} )
		);

		const notices = select( noticesStore ).getNotices();
		const insertAction = notices[ 0 ].actions[ 0 ];

		act( () => {
			insertAction.onClick?.();
		} );

		expect( onLayoutChange ).toHaveBeenCalledWith( [
			{ uuid: 'w1', type: 'core/quick-draft' },
			expect.objectContaining( {
				type: 'my-plugin/analytics',
				uuid: expect.any( String ),
			} ),
		] );

		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
	} );

	it( 'dismisses notice without modifying layout when clicking Ignore', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			'core/quick-draft',
			'core/site-health',
		] );

		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: [ ...BASE_WIDGET_TYPES, NEW_OFFER_WIDGET ],
				isResolvingWidgetTypes: false,
				layout,
				onLayoutChange,
			} )
		);

		const notices = select( noticesStore ).getNotices();
		const ignoreAction = notices[ 0 ].actions[ 1 ];

		act( () => {
			ignoreAction.onClick?.();
		} );

		expect( onLayoutChange ).not.toHaveBeenCalled();
		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
	} );

	it( 'auto-inserts widget with auto presence and offers Remove action', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [
			'core/quick-draft',
			'core/site-health',
		] );

		const onLayoutChange = vi.fn();
		const layout: DashboardWidget[] = [
			{ uuid: 'existing-1', type: 'core/quick-draft' },
		];

		renderHook( () =>
			useDashboardUnseenWidgets( {
				widgetTypes: [ ...BASE_WIDGET_TYPES, NEW_AUTO_WIDGET ],
				isResolvingWidgetTypes: false,
				layout,
				onLayoutChange,
			} )
		);

		expect( onLayoutChange ).toHaveBeenCalledWith( [
			{ uuid: 'existing-1', type: 'core/quick-draft' },
			expect.objectContaining( {
				type: 'classic-plugin/box',
				uuid: expect.any( String ),
			} ),
		] );

		const notices = select( noticesStore ).getNotices();
		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ].actions ).toHaveLength( 1 );
		expect( notices[ 0 ].actions[ 0 ].label ).toBe( 'Remove' );

		const removeAction = notices[ 0 ].actions[ 0 ];

		act( () => {
			removeAction.onClick?.();
		} );

		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
	} );
} );
