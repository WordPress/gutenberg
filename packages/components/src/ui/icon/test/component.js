/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Icon } from '..';

const MockIcon = () => <svg />;

describe( 'props', () => {
	let base;

	beforeEach( () => {
		( { container: base } = render( <Icon icon={ <MockIcon /> } /> ) );
	} );

	test( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	test( 'should render fill', () => {
		const { container } = render(
			<Icon fill="red" icon={ <MockIcon /> } />
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render size', () => {
		const { container } = render(
			<Icon icon={ <MockIcon /> } size={ 31 } />
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );
} );
