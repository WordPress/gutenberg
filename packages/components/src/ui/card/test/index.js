/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	CardInnerBody,
} from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Card>
				<CardHeader title="WordPress.org" />
				<CardBody>Code is Poetry</CardBody>
				<CardFooter>
					<button>Agree</button>
				</CardFooter>
			</Card>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render elevation', () => {
		const { container } = render( <Card elevation /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render no elevation', () => {
		const { container } = render( <Card elevation={ false } /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render CardInnerBody', () => {
		const { container } = render(
			<Card>
				<CardHeader title="WordPress.org" />
				<CardInnerBody>Code is Poetry.</CardInnerBody>
				<CardFooter>
					<button>Agree</button>
				</CardFooter>
			</Card>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
