/**
 * External dependencies
 */
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { View } from '../index';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'props', () => {
	test( 'should render correctly', async () => {
		const container = createContainer();
		await render(
			<View>
				<span />
			</View>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render as another element', async () => {
		const container = createContainer();
		await render(
			<View as="p">
				<span />
			</View>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (string)', async () => {
		const container = createContainer();
		await render(
			<View
				as="p"
				css={ `
					background: pink;
				` }
			>
				<span />
			</View>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (object)', async () => {
		const container = createContainer();
		await render(
			<View
				as="p"
				css={ {
					background: 'pink',
				} }
			>
				<span />
			</View>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (Array)', async () => {
		const container = createContainer();
		await render(
			<View
				as="p"
				css={ [
					{
						background: 'pink',
					},
					`font-weight: bold;`,
				] }
			>
				<span />
			</View>,
			{ container }
		);
		expect( container ).toMatchSnapshot();
	} );
} );
