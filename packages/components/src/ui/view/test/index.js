/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<View>
				<span />
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render as another element', () => {
		const { container } = render(
			<View as="p">
				<span />
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
				<span />
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
				<span />
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
				<span />
			</View>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
