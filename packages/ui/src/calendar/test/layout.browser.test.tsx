import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@wordpress/theme/design-tokens.css';
import { Calendar, RangeCalendar } from '..';
import { ThemeProvider } from '../../utils/theme-provider';
import { getDateButton, getDateCell } from './__utils__';

const TEST_DATE = new Date( 2026, 0, 15 );

describe.each( [
	[ 'Calendar', Calendar ],
	[ 'RangeCalendar', RangeCalendar ],
] as const )( '%s layout', ( _, Component ) => {
	it.each( [
		{ label: 'one month', numberOfMonths: 1, width: 224 },
		{ label: 'two months', numberOfMonths: 2, width: 464 },
	] )(
		'keeps $label at the minimum width in a content-sized container',
		async ( { numberOfMonths, width } ) => {
			await render(
				<ThemeProvider isRoot>
					<div style={ { width: 800 } }>
						<div style={ { width: 'fit-content' } }>
							<Component
								defaultMonth={ TEST_DATE }
								numberOfMonths={ numberOfMonths }
							/>
						</div>
					</div>
				</ThemeProvider>
			);
			expect(
				screen.getByRole( 'application' ).getBoundingClientRect().width
			).toBe( width );
			for ( const grid of screen.getAllByRole( 'grid' ) ) {
				expect( grid.getBoundingClientRect().width ).toBe( 224 );
			}
		}
	);

	it( 'fills the container and preserves its minimum width when constrained', async () => {
		const view = await render(
			<ThemeProvider isRoot>
				<div style={ { width: 700, overflow: 'auto' } }>
					<Component defaultMonth={ TEST_DATE } />
				</div>
			</ThemeProvider>
		);
		const calendar = screen.getByRole( 'application' );
		const grid = screen.getByRole( 'grid' );
		expect( calendar.getBoundingClientRect().width ).toBe( 700 );
		expect( grid.getBoundingClientRect().width ).toBe( 700 );
		expect(
			getDateButton( TEST_DATE ).getBoundingClientRect().width
		).toBeCloseTo( 100 );

		await view.rerender(
			<ThemeProvider isRoot>
				<div style={ { width: 200, overflow: 'auto' } }>
					<Component defaultMonth={ TEST_DATE } />
				</div>
			</ThemeProvider>
		);
		expect( calendar.getBoundingClientRect().width ).toBe( 224 );
		expect( grid.getBoundingClientRect().width ).toBe( 224 );
		expect( calendar.parentElement?.scrollWidth ).toBe( 224 );
	} );

	it( 'shares each row equally between months and wraps when they do not fit', async () => {
		const view = await render(
			<ThemeProvider isRoot>
				<div style={ { width: 750 } }>
					<Component
						defaultMonth={ TEST_DATE }
						numberOfMonths={ 3 }
					/>
				</div>
			</ThemeProvider>
		);
		const grids = screen.getAllByRole( 'grid' );
		const firstRow = grids.map( ( grid ) => grid.getBoundingClientRect() );
		expect( firstRow[ 0 ].width ).toBeGreaterThan( 224 );
		for ( const rect of firstRow ) {
			expect( rect.width ).toBeCloseTo( firstRow[ 0 ].width, 1 );
			expect( rect.top ).toBe( firstRow[ 0 ].top );
		}

		await view.rerender(
			<ThemeProvider isRoot>
				<div style={ { width: 600 } }>
					<Component
						defaultMonth={ TEST_DATE }
						numberOfMonths={ 3 }
					/>
				</div>
			</ThemeProvider>
		);
		const wrapped = grids.map( ( grid ) => grid.getBoundingClientRect() );
		expect( wrapped[ 0 ].width ).toBeCloseTo( wrapped[ 1 ].width, 1 );
		expect( wrapped[ 0 ].top ).toBe( wrapped[ 1 ].top );
		expect( wrapped[ 2 ].top ).toBeGreaterThan( wrapped[ 0 ].bottom );
		expect( wrapped[ 2 ].width ).toBe( 600 );
	} );
} );

it( 'fills stretched range cells with previews without scaling their strokes or corners', async () => {
	await render(
		<ThemeProvider isRoot>
			<div style={ { width: 700 } }>
				<RangeCalendar
					defaultMonth={ TEST_DATE }
					defaultValue={ { from: new Date( 2026, 0, 12 ) } }
				/>
			</div>
		</ThemeProvider>
	);
	await userEvent.hover( getDateButton( TEST_DATE ) );
	const cell = getDateCell( TEST_DATE );
	// eslint-disable-next-line testing-library/no-node-access -- The decorative SVG has no accessible role; inspect its rendered geometry.
	const preview = cell.querySelector( 'svg' )!;
	expect( preview.getBoundingClientRect().width ).toBeCloseTo(
		cell.getBoundingClientRect().width
	);
	expect( preview.getBoundingClientRect().height ).toBe( 32 );
	// eslint-disable-next-line testing-library/no-node-access -- SVG shapes have no accessible role; inspect the rendered outline.
	const outline = preview.querySelector( 'rect, path, line' )!;
	expect( outline.getBoundingClientRect().width ).toBeGreaterThan( 95 );
	expect( getComputedStyle( outline ).strokeWidth ).toBe( '1px' );
	const matrix = ( outline as SVGGraphicsElement ).getScreenCTM();
	expect( matrix?.a ).toBe( 1 );
	expect( matrix?.d ).toBe( 1 );
} );
