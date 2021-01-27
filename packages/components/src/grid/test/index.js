/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import View from '../../view';
import Grid from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Grid>
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render gap', () => {
		const { container } = render(
			<Grid columns="3" gap={ 4 }>
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom columns', () => {
		const { container } = render(
			<Grid columns="3">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom rows', () => {
		const { container } = render(
			<Grid rows="3">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Grid align="flex-start" columns="3">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render justify', () => {
		const { container } = render(
			<Grid columns="3" justify="flex-start">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isInline', () => {
		const { container } = render(
			<Grid columns="3" isInline>
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom templateColumns', () => {
		const { container } = render(
			<Grid templateColumns="1fr auto 1fr">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom templateRows', () => {
		const { container } = render(
			<Grid templateRows="1fr auto 1fr">
				<View />
				<View />
				<View />
			</Grid>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
