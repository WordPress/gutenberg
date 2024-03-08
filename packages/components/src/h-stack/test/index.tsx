/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { HStack } from '..';

describe( 'props', () => {
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
		const AsComponent = ( props: JSX.IntrinsicElements[ 'div' ] ) => {
			return <div { ...props } />;
		};

		render( <HStack as={ AsComponent }>foobar</HStack> );

		expect( console ).not.toHaveErrored();
	} );
} );
