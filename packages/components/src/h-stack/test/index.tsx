/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { HStack } from '..';

describe( 'props', () => {
	test( 'should apply default horizontal stack styles', () => {
		render(
			<HStack data-testid="h-stack">
				<View />
				<View />
			</HStack>
		);

		const styles = window.getComputedStyle(
			screen.getByTestId( 'h-stack' )
		);

		expect( styles.alignItems ).toBe( 'center' );
		expect( styles.display ).toBe( 'flex' );
		expect( styles.gap ).toBe( 'calc(4px * 2)' );
		expect( styles.justifyContent ).toBe( 'space-between' );
	} );

	test( 'should render correctly', () => {
		const { container } = render(
			<HStack>
				<View />
				<View />
			</HStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render alignment', () => {
		const { container } = render(
			<HStack alignment="center">
				<View />
				<View />
			</HStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render spacing', () => {
		const { container } = render(
			<HStack spacing={ 5 }>
				<View />
				<View />
			</HStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should not pass through invalid props to the `as` component', () => {
		const AsComponent = ( props: React.JSX.IntrinsicElements[ 'div' ] ) => {
			return <div { ...props } />;
		};

		render( <HStack as={ AsComponent }>foobar</HStack> );

		expect( console ).not.toHaveErrored();
	} );
} );
