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
		const { container } = render( <Button>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render disabled', () => {
		const { container } = render( <Button disabled>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render elevation', () => {
		const { container } = render(
			<Button elevation={ 3 }>Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render (Flex) gap', () => {
		const { container } = render( <Button gap={ 1 }>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render hasCaret', () => {
		const { container } = render( <Button hasCaret>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render as link (href)', () => {
		const { container } = render( <Button href="#">Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render icon', () => {
		const { container } = render(
			<Button icon={ <MockIcon /> }>Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isControl', () => {
		const { container } = render( <Button isControl>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isDestructive', () => {
		const { container } = render(
			<Button isDestructive>Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isLoading', () => {
		const { container } = render( <Button isLoading>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isNarrow', () => {
		const { container } = render( <Button isNarrow>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isRounded', () => {
		const { container } = render( <Button isRounded>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isSubtle', () => {
		const { container } = render( <Button isSubtle>Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render prefix', () => {
		const { container } = render(
			<Button prefix={ <span>Let</span> }>Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render size', () => {
		const { container } = render( <Button size="small">Let It Go</Button> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render suffix', () => {
		const { container } = render(
			<Button suffix={ <span>Let</span> }>Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render variant', () => {
		const { container } = render(
			<Button variant="primary">Let It Go</Button>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
