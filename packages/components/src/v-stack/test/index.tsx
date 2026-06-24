/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { VStack } from '..';

describe( 'props', () => {
	test( 'should apply default vertical stack styles', () => {
		render(
			<VStack data-testid="v-stack">
				<View />
				<View />
			</VStack>
		);

		const styles = window.getComputedStyle(
			screen.getByTestId( 'v-stack' )
		);

		expect( styles.alignItems ).toBe( 'stretch' );
		expect( styles.display ).toBe( 'flex' );
		expect( styles.flexDirection ).toBe( 'column' );
		expect( styles.gap ).toBe( 'calc(4px * 2)' );
		expect( styles.justifyContent ).toBe( 'center' );
	} );

	test( 'should render correctly', () => {
		const { container } = render(
			<VStack>
				<View />
				<View />
			</VStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render alignment', () => {
		const { container } = render(
			<VStack alignment="center">
				<View />
				<View />
			</VStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render spacing', () => {
		const { container } = render(
			<VStack spacing={ 5 }>
				<View />
				<View />
			</VStack>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should not pass through invalid props to the `as` component', () => {
		const AsComponent = ( props: React.JSX.IntrinsicElements[ 'div' ] ) => {
			return <div { ...props } />;
		};

		render( <VStack as={ AsComponent }>foobar</VStack> );

		expect( console ).not.toHaveErrored();
	} );
} );
