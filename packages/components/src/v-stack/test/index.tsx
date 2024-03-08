/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { VStack } from '..';

describe( 'props', () => {
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
		const AsComponent = ( props: JSX.IntrinsicElements[ 'div' ] ) => {
			return <div { ...props } />;
		};

		render( <VStack as={ AsComponent }>foobar</VStack> );

		expect( console ).not.toHaveErrored();
	} );
} );
