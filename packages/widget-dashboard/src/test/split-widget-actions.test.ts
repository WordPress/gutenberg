import { describe, expect, it } from 'vitest';
import { createElement } from '@wordpress/element';
import type {
	WidgetAction,
	WidgetRuntimeAction,
	WidgetType,
} from '@wordpress/widget-primitives';
import { mergeWidgetActions } from '../utils/merge-widget-actions';
import { splitWidgetActions } from '../utils/split-widget-actions';

const details: WidgetAction = {
	id: 'details',
	label: 'Details',
	relevance: 'high',
	href: 'admin.php?page=dashboard&p=/details',
};

const status: WidgetAction = {
	id: 'status',
	label: 'Status',
	href: 'site-health.php',
};

const review: WidgetRuntimeAction = {
	id: 'details',
	label: 'Review 3 items',
	relevance: 'high',
	href: 'admin.php?page=dashboard&p=/details?status=critical',
};

const exportCsv: WidgetRuntimeAction = {
	id: 'export',
	label: 'Export',
	relevance: 'medium',
	callback: () => {},
};

const widgetType: WidgetType = {
	apiVersion: 1,
	name: 'test/health',
	title: 'Health',
	renderModule: 'health-module',
	actions: [ details, status ],
};

describe( 'mergeWidgetActions', () => {
	it( 'returns the declared list untouched without runtime actions', () => {
		const declared = [ details, status ];

		expect( mergeWidgetActions( declared, [] ) ).toBe( declared );
	} );

	it( 'replaces a declared action in place and appends the rest', () => {
		expect(
			mergeWidgetActions( [ details, status ], [ exportCsv, review ] )
		).toEqual( [ review, status, exportCsv ] );
	} );

	it( 'keeps the declared icon and relevance a runtime action leaves out', () => {
		const icon = createElement( 'svg' );
		const upgrade: WidgetRuntimeAction = {
			id: 'details',
			label: 'Review 3 items',
			href: 'admin.php?page=dashboard&p=/details?status=critical',
		};

		expect(
			mergeWidgetActions( [ { ...details, icon } ], [ upgrade ] )
		).toEqual( [ { ...upgrade, icon, relevance: 'high' } ] );
	} );

	it( 'lets a runtime action set its own icon and relevance', () => {
		const declared = { ...details, icon: createElement( 'svg' ) };
		const ownIcon = createElement( 'svg', { viewBox: '0 0 24 24' } );

		const [ restyled ] = mergeWidgetActions(
			[ declared ],
			[ { ...review, relevance: 'low', icon: ownIcon } ]
		);
		expect( restyled.icon ).toBe( ownIcon );
		expect( restyled.relevance ).toBe( 'low' );

		const [ bare ] = mergeWidgetActions(
			[ declared ],
			[ { ...review, icon: undefined } ]
		);
		expect( bare.icon ).toBeUndefined();
	} );
} );

describe( 'splitWidgetActions', () => {
	it( 'routes the merged list by relevance', () => {
		expect(
			splitWidgetActions( widgetType, [ review, exportCsv ] )
		).toEqual( {
			footer: [ review, exportCsv ],
			menu: [ status ],
		} );
	} );

	it( 'keeps an upgraded action on the surface its declaration chose', () => {
		const upgrade: WidgetRuntimeAction = {
			id: 'details',
			label: 'Review 3 items',
			href: 'admin.php?page=dashboard&p=/details?status=critical',
		};

		const { footer, menu } = splitWidgetActions( widgetType, [ upgrade ] );

		expect( footer.map( ( { label } ) => label ) ).toEqual( [
			'Review 3 items',
		] );
		expect( menu ).toEqual( [ status ] );
	} );

	it( 'keeps every action in the menu for full-bleed widgets', () => {
		expect(
			splitWidgetActions( { ...widgetType, presentation: 'full-bleed' }, [
				exportCsv,
			] )
		).toEqual( { footer: [], menu: [ details, status, exportCsv ] } );
	} );

	it( 'places runtime actions of a type without declared ones', () => {
		expect(
			splitWidgetActions( { ...widgetType, actions: undefined }, [
				exportCsv,
			] )
		).toEqual( { footer: [ exportCsv ], menu: [] } );
	} );
} );
