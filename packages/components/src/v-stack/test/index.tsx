/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { VStack } from '..';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'props', () => {
	test( 'should render correctly', async () => {
		const container = createContainer();
		await render(
			<VStack>
				<View />
				<View />
			</VStack>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render alignment', async () => {
		const container = createContainer();
		await render(
			<VStack alignment="center">
				<View />
				<View />
			</VStack>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render spacing', async () => {
		const container = createContainer();
		await render(
			<VStack spacing={ 5 }>
				<View />
				<View />
			</VStack>,
			{ container }
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
