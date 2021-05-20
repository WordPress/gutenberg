/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Grid } from '..';
import CONFIG from '../../utils/config-values';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Grid>
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat(2,1fr)',
			gap: `calc( ${ CONFIG.gridBase } * 3 )`,
		} );
	} );

	test( 'should render gap', () => {
		const { container } = render(
			<Grid columns="3" gap={ 4 }>
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat(3,1fr)',
			gap: `calc( ${ CONFIG.gridBase } * 4 )`,
		} );
	} );

	test( 'should render custom columns', () => {
		const { container } = render(
			<Grid columns="7">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: 'repeat(7,1fr)',
		} );
	} );

	test( 'should render custom rows', () => {
		const { container } = render(
			<Grid rows="7">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateRows: 'repeat(7,1fr)',
		} );
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Grid align="flex-start">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			alignItems: 'flex-start',
			display: 'grid',
		} );
	} );

	test( 'should render alignment spaced', () => {
		const { container } = render(
			<Grid alignment="spaced">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			alignItems: 'center',
			justifyContent: 'space-between',
		} );
	} );

	test( 'should render justify', () => {
		const { container } = render(
			<Grid justify="flex-start">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			justifyContent: 'flex-start',
		} );
	} );

	test( 'should render isInline', () => {
		const { container } = render(
			<Grid columns="3" isInline>
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'inline-grid',
			gridTemplateColumns: 'repeat(3,1fr)',
		} );
	} );

	test( 'should render custom templateColumns', () => {
		const { container } = render(
			<Grid templateColumns="1fr auto 1fr">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateColumns: '1fr auto 1fr',
		} );
	} );

	test( 'should render custom templateRows', () => {
		const { container } = render(
			<Grid templateRows="1fr auto 1fr">
				<View />
				<View />
				<View />
			</Grid>
		);

		expect( container.firstChild ).toHaveStyle( {
			display: 'grid',
			gridTemplateRows: '1fr auto 1fr',
		} );
	} );
} );
