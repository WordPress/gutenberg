import { describe, expect, test } from 'vitest';
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

	test( 'should ignore unsupported runtime alignment values', async () => {
		await render(
			<Grid
				// @ts-expect-error Runtime JavaScript consumers can pass unsupported values.
				alignment="unsupported"
				data-testid="grid"
			>
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.alignItems ).toBe( 'normal' );
		expect( style.justifyContent ).toBe( 'normal' );
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
	test( 'specific layout props override their fallbacks', async () => {
		await render(
			<Grid
				data-testid="grid"
				alignment="spaced"
				align="end"
				justify="end"
				gap={ 5 }
				rowGap={ 0 }
				columnGap="2em"
				style={ { fontSize: 14 } }
			>
				<View />
			</Grid>
		);
		const style = getComputedStyle( screen.getByTestId( 'grid' ) );
		expect( style.alignItems ).toBe( 'center' );
		expect( style.justifyContent ).toBe( 'space-between' );
		expect( style.rowGap ).toBe( '0px' );
		expect( style.columnGap ).toBe( '28px' );
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

	test( 'consumer stylesheets retain precedence', async () => {
		const consumerStyle = document.createElement( 'style' );
		consumerStyle.textContent =
			'.grid-consumer.grid-consumer, .grid-disabled { align-items: end; justify-content: end; grid-template-columns: 100px; grid-template-rows: 90px; }';
		document.head.prepend( consumerStyle );

		try {
			await render(
				<>
					<Grid
						data-testid="grid-with-props"
						className="grid-consumer"
						align="start"
						justify="start"
						columns={ 3 }
						rows={ 2 }
					>
						<View />
					</Grid>
					<Grid
						data-testid="grid-with-disabled-tracks"
						className="grid-disabled"
						columns={ [ 0 ] }
						rows={ [ 0 ] }
					>
						<View />
					</Grid>
				</>
			);

			for ( const testId of [
				'grid-with-props',
				'grid-with-disabled-tracks',
			] ) {
				const style = getComputedStyle( screen.getByTestId( testId ) );
				expect( style.alignItems ).toBe( 'end' );
				expect( style.justifyContent ).toBe( 'end' );
				expect( style.gridTemplateColumns ).toBe( '100px' );
				expect( style.gridTemplateRows ).toBe( '90px' );
			}
		} finally {
			consumerStyle.remove();
		}
	} );

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
} );
