/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Card, CardBody, CardFooter, CardHeader } from '../index';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		base = render(
			<Card>
				<CardHeader title="WordPress.org" />
				<CardBody>Code is Poetry.</CardBody>
				<CardFooter>
					<button>Agree</button>
				</CardFooter>
			</Card>
		);
	} );

	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render elevation', () => {
		const { container } = render( <Card elevation /> );
		const { container: withoutElevation } = render(
			<Card elevation={ false } />
		);
		expect( container.firstChild ).toMatchDiffSnapshot(
			withoutElevation.firstChild
		);
	} );
} );
