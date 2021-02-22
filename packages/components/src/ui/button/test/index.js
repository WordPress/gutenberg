/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Button } from '..';

const MockIcon = () => <svg />;

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Button>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render disabled', () => {
		const { container } = render( <Button disabled>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render elevation', () => {
		const { container } = render( <Button elevation={ 3 }>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render (Flex) gap', () => {
		const { container } = render( <Button gap={ 1 }>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render hasCaret', () => {
		const { container } = render( <Button hasCaret>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render as link (href)', () => {
		const { container } = render( <Button href="#">Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render icon', () => {
		const { container } = render(
			<Button icon={ <MockIcon /> }>Lorem</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isControl', () => {
		const { container } = render( <Button isControl>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isDestructive', () => {
		const { container } = render( <Button isDestructive>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isLoading', () => {
		const { container } = render( <Button isLoading>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isNarrow', () => {
		const { container } = render( <Button isNarrow>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isRounded', () => {
		const { container } = render( <Button isRounded>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isSubtle', () => {
		const { container } = render( <Button isSubtle>Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render prefix', () => {
		const { container } = render(
			<Button pre={ <span>Prefix</span> }>Lorem</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render size', () => {
		const { container } = render( <Button size="small">Lorem</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render suffix', () => {
		const { container } = render(
			<Button suffix={ <span>Suffix</span> }>Lorem</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render variant', () => {
		const { container } = render(
			<Button variant="primary">Lorem</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
