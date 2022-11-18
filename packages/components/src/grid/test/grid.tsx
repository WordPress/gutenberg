/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Grid } from '..';
import CONFIG from '../../utils/config-values';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Grid role="grid">
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat( 2, 1fr )',
			gap: `calc( ${ CONFIG.gridBase } * 3 )`,
		} );
	} );

	test( 'should render gap', () => {
		render(
			<Grid columns={ 3 } gap={ 4 } role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat( 3, 1fr )',
			gap: `calc( ${ CONFIG.gridBase } * 4 )`,
		} );
	} );

	test( 'should render custom columns', () => {
		render(
			<Grid columns={ 7 } role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat( 7, 1fr )',
		} );
	} );

	test( 'should render custom rows', () => {
		render(
			<Grid rows={ 7 } role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateRows: 'repeat( 7, 1fr )',
		} );
	} );

	test( 'should render align', () => {
		render(
			<Grid align="flex-start" role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			alignItems: 'flex-start',
			display: 'grid',
		} );
	} );

	test( 'should render alignment spaced', () => {
		render(
			<Grid alignment="spaced" role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			alignItems: 'center',
			justifyContent: 'space-between',
		} );
	} );

	test( 'should render justify', () => {
		render(
			<Grid justify="flex-start" role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			justifyContent: 'flex-start',
		} );
	} );

	test( 'should render isInline', () => {
		render(
			<Grid columns={ 3 } isInline role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'inline-grid',
			gridTemplateColumns: 'repeat( 3, 1fr )',
		} );
	} );

	test( 'should render custom templateColumns', () => {
		render(
			<Grid templateColumns="1fr auto 1fr" role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: '1fr auto 1fr',
		} );
	} );

	test( 'should render custom templateRows', () => {
		render(
			<Grid templateRows="1fr auto 1fr" role="grid">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( screen.getByRole( 'grid' ) ).toHaveStyle( {
			display: 'grid',
			gridTemplateRows: '1fr auto 1fr',
		} );
	} );
} );
