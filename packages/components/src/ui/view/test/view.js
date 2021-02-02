/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import View from '../view';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<View>
				<span>Some people are worth melting for.</span>
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render as another element', () => {
		const { container } = render(
			<View as="p">
				<span>Some people are worth melting for.</span>
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (string)', () => {
		const { container } = render(
			<View
				as="p"
				css={ `
					background: pink;
				` }
			>
				<span>Some people are worth melting for.</span>
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (object)', () => {
		const { container } = render(
			<View
				as="p"
				css={ {
					background: 'pink',
				} }
			>
				<span>Some people are worth melting for.</span>
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render with custom styles (Array)', () => {
		const { container } = render(
			<View
				as="p"
				css={ [
					{
						background: 'pink',
					},
					`font-weight: bold;`,
				] }
			>
				<span>Some people are worth melting for.</span>
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
