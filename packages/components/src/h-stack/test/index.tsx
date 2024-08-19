/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { HStack } from '..';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'props', () => {
	test( 'should render correctly', () => {
		const container = createContainer();
		render(
			<HStack>
				<View />
				<View />
			</HStack>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render alignment', () => {
		const container = createContainer();
		render(
			<HStack alignment="center">
				<View />
				<View />
			</HStack>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render spacing', () => {
		const container = createContainer();
		render(
			<HStack spacing={ 5 }>
				<View />
				<View />
			</HStack>,
			{ container }
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
