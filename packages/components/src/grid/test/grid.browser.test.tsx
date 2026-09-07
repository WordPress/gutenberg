import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { View } from '../../view';
import { Grid } from '..';
import CONFIG from '../../utils/config-values';

describe( 'props', () => {
	const readStyle = () => getComputedStyle( screen.getByTestId( 'grid' ) );
	const readTracks = ( value: string ) => value.trim().split( /\s+/ );
	const expectEqualTracks = ( value: string, count: number ) => {
		const tracks = readTracks( value );
		expect( tracks ).toHaveLength( count );
		const widths = tracks.map( Number.parseFloat );
		expect(
			Math.max( ...widths ) - Math.min( ...widths )
		).toBeLessThanOrEqual( 0.02 );
	};

	test( 'should render correctly', async () => {
		await render(
			<Grid data-testid="grid">
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expectEqualTracks( style.gridTemplateColumns, 2 );
		expect( style.gap ).toBe(
			`${ Number.parseFloat( CONFIG.gridBase ) * 3 }px`
		);
	} );

	test( 'should render gap', async () => {
		await render(
			<Grid columns={ 3 } gap={ 4 } data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expectEqualTracks( style.gridTemplateColumns, 3 );
		expect( style.gap ).toBe(
			`${ Number.parseFloat( CONFIG.gridBase ) * 4 }px`
		);
	} );

	test( 'should render custom columns', async () => {
		await render(
			<Grid columns={ 7 } data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expectEqualTracks( style.gridTemplateColumns, 7 );
	} );

	test( 'should render custom rows', async () => {
		await render(
			<Grid rows={ 7 } data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expectEqualTracks( style.gridTemplateRows, 7 );
	} );

	test( 'should render align', async () => {
		await render(
			<Grid align="flex-start" data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.alignItems ).toBe( 'flex-start' );
		expect( style.display ).toBe( 'grid' );
	} );

	test( 'should render alignment spaced', async () => {
		await render(
			<Grid alignment="spaced" data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( style.alignItems ).toBe( 'center' );
		expect( style.justifyContent ).toBe( 'space-between' );
	} );

	test( 'should render justify', async () => {
		await render(
			<Grid justify="flex-start" data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( style.justifyContent ).toBe( 'flex-start' );
	} );

	test( 'should render isInline', async () => {
		await render(
			<Grid columns={ 3 } isInline data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'inline-grid' );
		expectEqualTracks( style.gridTemplateColumns, 3 );
	} );

	test( 'should render custom templateColumns', async () => {
		await render(
			<Grid
				templateColumns="1fr auto 1fr"
				data-testid="grid"
				style={ { width: 300 } }
			>
				<View />
				<View style={ { width: 24 } } />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( style.gridTemplateColumns ).toBe( '126px 24px 126px' );
	} );

	test( 'should render custom templateRows', async () => {
		await render(
			<Grid
				columns={ 1 }
				templateRows="1fr auto 1fr"
				data-testid="grid"
				style={ { height: 300 } }
			>
				<View />
				<View style={ { height: 24 } } />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( style.gridTemplateRows ).toBe( '126px 24px 126px' );
	} );
} );

describe( 'style composition', () => {
	test.each( [
		[ undefined, undefined, '20px', '20px' ],
		[ 0, '2em', '0px', '28px' ],
		[ '10%', 7, '10%', '7px' ],
		[ '', '', '20px', '20px' ],
	] )(
		'rowGap %s and columnGap %s override the shared gap',
		async ( rowGap, columnGap, expectedRowGap, expectedColumnGap ) => {
			await render(
				<Grid
					data-testid="grid"
					gap={ 5 }
					rowGap={ rowGap }
					columnGap={ columnGap }
					style={ { fontSize: 14 } }
				>
					<View />
				</Grid>
			);
			const style = getComputedStyle( screen.getByTestId( 'grid' ) );
			expect( style.rowGap ).toBe( expectedRowGap );
			expect( style.columnGap ).toBe( expectedColumnGap );
		}
	);

	test( 'alignment takes precedence over align and justify', async () => {
		await render(
			<Grid
				data-testid="grid"
				alignment="spaced"
				align="end"
				justify="end"
			>
				<View />
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.alignItems ).toBe( 'center' );
		expect( style.justifyContent ).toBe( 'space-between' );
	} );

	test( 'nested Grids use their own layout props', async () => {
		await render(
			<Grid
				columns={ 1 }
				rows={ 2 }
				rowGap={ 40 }
				columnGap={ 50 }
				align="end"
				justify="end"
			>
				<Grid data-testid="grid" style={ { width: 300 } }>
					<View />
					<View />
				</Grid>
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.gridTemplateColumns ).toBe( '144px 144px' );
		expect( style.rowGap ).toBe( '12px' );
		expect( style.columnGap ).toBe( '12px' );
		expect( style.alignItems ).toBe( 'normal' );
		expect( style.justifyContent ).toBe( 'normal' );
	} );

	test( 'zero columns and rows leave track generation to CSS', async () => {
		await render(
			<Grid data-testid="grid" columns={ 0 } rows={ 0 } gap={ 0 }>
				{ null }
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.gridTemplateColumns ).toBe( 'none' );
		expect( style.gridTemplateRows ).toBe( 'none' );
		expect( style.gap ).toBe( '0px' );
	} );

	test( 'inline styles override layout props', async () => {
		await render(
			<Grid
				data-testid="grid"
				align="end"
				gap={ 5 }
				columns={ 3 }
				style={ {
					display: 'flex',
					gap: 9,
					alignItems: 'start',
					gridTemplateColumns: '50px',
				} }
			>
				<View />
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.display ).toBe( 'flex' );
		expect( style.gap ).toBe( '9px' );
		expect( style.alignItems ).toBe( 'start' );
		expect( style.gridTemplateColumns ).toBe( '50px' );
	} );

	test( 'consumer stylesheets can override layout props', async () => {
		await render(
			<>
				<style>{ `.grid-consumer.grid-consumer { gap: 23px; align-items: end; grid-template-columns: 100px 100px; }` }</style>
				<Grid
					data-testid="grid"
					className="grid-consumer"
					align="start"
					columns={ 3 }
				>
					<View />
				</Grid>
			</>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.gap ).toBe( '23px' );
		expect( style.alignItems ).toBe( 'end' );
		expect( style.gridTemplateColumns ).toBe( '100px 100px' );
	} );

	test.each( [
		{ name: 'zero tracks', columns: 0, rows: 0 },
		{ name: 'empty responsive tracks', columns: [], rows: [] },
		{
			name: 'undefined responsive tracks',
			columns: [ undefined ],
			rows: [ undefined ],
		},
		{ name: 'zero responsive tracks', columns: [ 0 ], rows: [ 0 ] },
	] )(
		'preserves consumer styles with $name and overrides them with explicit values',
		async ( { columns, rows } ) => {
			const consumerStyle = document.createElement( 'style' );
			consumerStyle.textContent =
				'.grid-consumer { align-items: end; justify-content: end; grid-template-columns: 100px; grid-template-rows: 90px; }';
			document.head.prepend( consumerStyle );

			try {
				const { rerender } = await render(
					<Grid
						data-testid="grid"
						className="grid-consumer"
						columns={ columns }
						rows={ rows }
					>
						<View />
					</Grid>
				);
				let style = getComputedStyle( screen.getByTestId( 'grid' ) );
				expect( style.alignItems ).toBe( 'end' );
				expect( style.justifyContent ).toBe( 'end' );
				expect( style.gridTemplateColumns ).toBe( '100px' );
				expect( style.gridTemplateRows ).toBe( '90px' );

				await rerender(
					<Grid
						data-testid="grid"
						className="grid-consumer"
						columns={ 0 }
						align="start"
						justify="start"
						templateColumns="200px"
						templateRows="120px"
					>
						<View />
					</Grid>
				);
				style = getComputedStyle( screen.getByTestId( 'grid' ) );
				expect( style.alignItems ).toBe( 'start' );
				expect( style.justifyContent ).toBe( 'start' );
				expect( style.gridTemplateColumns ).toBe( '200px' );
				expect( style.gridTemplateRows ).toBe( '120px' );
			} finally {
				consumerStyle.remove();
			}
		}
	);

	test( 'CSS-wide values apply to the layout properties', async () => {
		await render(
			<div
				style={ {
					display: 'grid',
					alignItems: 'end',
					justifyContent: 'end',
					rowGap: 27,
					columnGap: 29,
					gridTemplateColumns: '300px',
					gridTemplateRows: '100px',
				} }
			>
				<Grid
					data-testid="grid"
					align="inherit"
					justify="inherit"
					rowGap="inherit"
					columnGap="inherit"
					templateColumns="inherit"
					templateRows="inherit"
				>
					<View />
				</Grid>
			</div>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.alignItems ).toBe( 'end' );
		expect( style.justifyContent ).toBe( 'end' );
		expect( style.rowGap ).toBe( '27px' );
		expect( style.columnGap ).toBe( '29px' );
		expect( style.gridTemplateColumns ).toBe( '300px' );
		expect( style.gridTemplateRows ).toBe( '100px' );
	} );

	test( 'CSS-wide gap resets override the shared gap', async () => {
		await render(
			<Grid
				data-testid="grid"
				gap={ 5 }
				rowGap="initial"
				columnGap="initial"
			>
				<View />
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.rowGap ).toBe( 'normal' );
		expect( style.columnGap ).toBe( 'normal' );
	} );

	test( 'responsive tracks follow the existing viewport breakpoints', async () => {
		await render(
			<Grid
				data-testid="grid"
				columns={ [ 1, 2, 3, 4 ] }
				rows={ [ 1, 2, 3, 4 ] }
				style={ { width: 300, height: 300 } }
			>
				<View />
			</Grid>
		);
		for ( const [ width, tracks ] of [
			[ 600, 1 ],
			[ 700, 2 ],
			[ 900, 3 ],
			[ 1100, 4 ],
		] ) {
			await page.viewport( width, 800 );
			await expect
				.poll(
					() =>
						getComputedStyle(
							screen.getByTestId( 'grid' )
						).gridTemplateColumns.split( ' ' ).length
				)
				.toBe( tracks );
			expect(
				getComputedStyle(
					screen.getByTestId( 'grid' )
				).gridTemplateRows.split( ' ' )
			).toHaveLength( tracks );
		}
	} );

	test( 'forwards the element type, ref, and consumer props', async () => {
		const ref = createRef< HTMLAnchorElement >();
		await render(
			<Grid as="a" ref={ ref } href="#target" className="consumer-class">
				Grid link
			</Grid>
		);
		expect( ref.current ).toBe(
			screen.getByRole( 'link', { name: 'Grid link' } )
		);
		expect( ref.current?.getAttribute( 'href' ) ).toBe( '#target' );
		expect( ref.current?.classList.contains( 'components-grid' ) ).toBe( true );
		expect( ref.current?.classList.contains( 'consumer-class' ) ).toBe( true );
	} );
} );
