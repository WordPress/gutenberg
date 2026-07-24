/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

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
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render as another element', () => {
		const { container } = render(
			<View as="p">
				<span />
			</View>
		);
		expect( container ).toMatchSnapshot();
	} );

	test( 'should render as a custom component', () => {
		const CustomComponent = forwardRef( ( props, ref ) => (
			<section ref={ ref } data-custom-component { ...props } />
		) );

		const ref = jest.fn();
		const { container } = render(
			<View
				as={ CustomComponent }
				className="custom-class"
				data-testid="custom-view"
				ref={ ref }
			>
				<span />
			</View>
		);

		const customView = screen.getByTestId( 'custom-view' );
		expect( container ).toMatchSnapshot();
		expect( ref ).toHaveBeenCalledWith( customView );
	} );

	test( 'should preserve SVG attributes', () => {
		render(
			<View
				as="svg"
				data-testid="svg-view"
				fill="currentColor"
				strokeWidth={ 2 }
				viewBox="0 0 24 24"
			/>
		);

		const svgView = screen.getByTestId( 'svg-view' );
		expect( svgView ).toHaveAttribute( 'fill', 'currentColor' );
		expect( svgView ).toHaveAttribute( 'stroke-width', '2' );
		expect( svgView ).toHaveAttribute( 'viewBox', '0 0 24 24' );
	} );

	test( 'should ignore legacy css prop styles (string)', () => {
		const { container } = render(
			<View
				as="p"
				data-testid="custom-css-string-view"
				css={ `
					background: pink;
				` }
			>
				<span />
			</View>
		);
		expect( container ).toMatchSnapshot();
		expect(
			screen.getByTestId( 'custom-css-string-view' )
		).not.toHaveAttribute( 'css' );
	} );

	test( 'should ignore legacy css prop styles (object)', () => {
		const { container } = render(
			<View
				as="p"
				data-testid="custom-css-object-view"
				css={ {
					background: 'pink',
				} }
			>
				<span />
			</View>
		);
		expect( container ).toMatchSnapshot();
		expect(
			screen.getByTestId( 'custom-css-object-view' )
		).not.toHaveAttribute( 'css' );
	} );

	test( 'should ignore legacy css prop styles (array)', () => {
		const { container } = render(
			<View
				as="p"
				data-testid="custom-css-array-view"
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
		expect( container ).toMatchSnapshot();
		expect(
			screen.getByTestId( 'custom-css-array-view' )
		).not.toHaveAttribute( 'css' );
	} );
} );
