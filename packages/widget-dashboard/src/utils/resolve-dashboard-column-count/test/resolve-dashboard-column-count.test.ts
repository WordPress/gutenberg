/**
 * Internal dependencies
 */
import {
	resolveDashboardColumnCount,
	WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN,
	WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS,
} from '../resolve-dashboard-column-count';

describe( 'resolveDashboardColumnCount', () => {
	it( 'defaults to four columns before measurement', () => {
		expect( resolveDashboardColumnCount( 0 ) ).toBe( 4 );
	} );

	it( 'uses four columns at wide container sizes', () => {
		expect(
			resolveDashboardColumnCount(
				WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS
			)
		).toBe( 4 );
		expect( resolveDashboardColumnCount( 1200 ) ).toBe( 4 );
	} );

	it( 'uses two columns between mobile and wide breakpoints', () => {
		expect(
			resolveDashboardColumnCount(
				WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN
			)
		).toBe( 2 );
		expect(
			resolveDashboardColumnCount(
				WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS - 1
			)
		).toBe( 2 );
	} );

	it( 'uses one column below the mobile container breakpoint', () => {
		expect(
			resolveDashboardColumnCount(
				WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN - 1
			)
		).toBe( 1 );
	} );
} );
