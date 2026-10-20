import { describe, expect, it } from 'vitest';
import type { WidgetType } from '@wordpress/widget-primitives';
import { FOOTPRINT_LIMITS, resolveItemLimits } from '../resolve-item-limits';
import type { DashboardWidget } from '../../../types';

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/glance',
		title: 'Glance',
		renderModule: 'glance-module',
	},
	{
		apiVersion: 1,
		name: 'test/card',
		title: 'Card',
		renderModule: 'card-module',
		footprint: 'card',
	},
	{
		apiVersion: 1,
		name: 'test/panel',
		title: 'Panel',
		renderModule: 'panel-module',
		footprint: 'panel',
	},
];

function placed( uuid: string, type: string ): DashboardWidget {
	return { uuid, type: type as DashboardWidget[ 'type' ] };
}

describe( 'resolveItemLimits', () => {
	it( 'leaves the surface unbounded when no placed widget has a floor', () => {
		expect( resolveItemLimits( [], widgetTypes ) ).toBeUndefined();
		expect(
			resolveItemLimits( [ placed( 'a', 'test/glance' ) ], widgetTypes )
		).toBeUndefined();
	} );

	it( 'keys each floor by the instance uuid', () => {
		expect(
			resolveItemLimits(
				[
					placed( 'a', 'test/card' ),
					placed( 'b', 'test/glance' ),
					placed( 'c', 'test/panel' ),
					placed( 'd', 'test/card' ),
				],
				widgetTypes
			)
		).toEqual( {
			a: FOOTPRINT_LIMITS.card,
			c: FOOTPRINT_LIMITS.panel,
			d: FOOTPRINT_LIMITS.card,
		} );
	} );

	it( 'skips instances whose type is not registered', () => {
		expect(
			resolveItemLimits( [ placed( 'a', 'test/missing' ) ], widgetTypes )
		).toBeUndefined();
	} );
} );
