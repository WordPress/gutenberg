import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { View } from '../../view';
import { Grid } from '..';
import CONFIG from '../../utils/config-values';

describe( 'props', () => {
	const readStyle = () => getComputedStyle( screen.getByTestId( 'grid' ) );
	const countTracks = ( value: string ) => value.trim().split( /\s+/ ).length;

	test( 'should render correctly', async () => {
		await render(
			<Grid data-testid="grid">
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( countTracks( style.gridTemplateColumns ) ).toBe( 2 );
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
		expect( countTracks( style.gridTemplateColumns ) ).toBe( 3 );
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
		expect( countTracks( style.gridTemplateColumns ) ).toBe( 7 );
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
		expect( countTracks( style.gridTemplateRows ) ).toBe( 7 );
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
		expect( countTracks( style.gridTemplateColumns ) ).toBe( 3 );
	} );

	test( 'should render custom templateColumns', async () => {
		await render(
			<Grid templateColumns="1fr auto 1fr" data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( countTracks( style.gridTemplateColumns ) ).toBe( 3 );
	} );

	test( 'should render custom templateRows', async () => {
		await render(
			<Grid templateRows="1fr auto 1fr" data-testid="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		const style = readStyle();
		expect( style.display ).toBe( 'grid' );
		expect( countTracks( style.gridTemplateRows ) ).toBe( 3 );
	} );
} );
