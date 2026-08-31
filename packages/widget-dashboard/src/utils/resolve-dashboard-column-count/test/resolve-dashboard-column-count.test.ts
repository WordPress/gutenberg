import {
	resolveDashboardColumnCap,
	resolveDashboardColumnCount,
	WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN,
	WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS,
} from '../resolve-dashboard-column-count';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../../types';

describe( 'resolveDashboardColumnCap', () => {
	it( 'falls back to the package default when the host sets nothing', () => {
		expect( resolveDashboardColumnCap( undefined ) ).toBe(
			WIDGET_DASHBOARD_COLUMN_COUNT
		);
	} );

	it( 'keeps a cap within range', () => {
		expect( resolveDashboardColumnCap( 3 ) ).toBe( 3 );
		expect( resolveDashboardColumnCap( 1 ) ).toBe( 1 );
		expect(
			resolveDashboardColumnCap( WIDGET_DASHBOARD_COLUMN_COUNT )
		).toBe( WIDGET_DASHBOARD_COLUMN_COUNT );
	} );

	it( 'renders counts above the package default as asked', () => {
		expect(
			resolveDashboardColumnCap( WIDGET_DASHBOARD_COLUMN_COUNT + 2 )
		).toBe( WIDGET_DASHBOARD_COLUMN_COUNT + 2 );
	} );

	it( 'never drops below one column', () => {
		expect( resolveDashboardColumnCap( 0 ) ).toBe( 1 );
		expect( resolveDashboardColumnCap( -3 ) ).toBe( 1 );
	} );

	it( 'floors a fractional cap', () => {
		expect( resolveDashboardColumnCap( 2.9 ) ).toBe( 2 );
	} );

	it( 'treats a non-numeric cap as unset', () => {
		expect( resolveDashboardColumnCap( Number.NaN ) ).toBe(
			WIDGET_DASHBOARD_COLUMN_COUNT
		);
		expect( resolveDashboardColumnCap( Number.POSITIVE_INFINITY ) ).toBe(
			WIDGET_DASHBOARD_COLUMN_COUNT
		);
	} );
} );

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

	describe( 'with a host cap', () => {
		it( 'uses the cap before measurement and on wide containers', () => {
			expect( resolveDashboardColumnCount( 0, 3 ) ).toBe( 3 );
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS,
					3
				)
			).toBe( 3 );
			expect( resolveDashboardColumnCount( 1200, 3 ) ).toBe( 3 );
		} );

		it( 'keeps the two- and one-column steps below the cap', () => {
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS - 1,
					3
				)
			).toBe( 2 );
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN - 1,
					3
				)
			).toBe( 1 );
		} );

		it( 'never steps above a cap of one in the middle band', () => {
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS - 1,
					1
				)
			).toBe( 1 );
			expect( resolveDashboardColumnCount( 1200, 1 ) ).toBe( 1 );
		} );

		it( 'uses a count above the default on wide containers', () => {
			expect( resolveDashboardColumnCount( 1200, 6 ) ).toBe( 6 );
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS - 1,
					6
				)
			).toBe( 2 );
		} );

		it( 'keeps a cap of two flat across the middle and wide bands', () => {
			expect(
				resolveDashboardColumnCount(
					WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS - 1,
					2
				)
			).toBe( 2 );
			expect( resolveDashboardColumnCount( 1200, 2 ) ).toBe( 2 );
		} );
	} );
} );
