/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	CardHeader,
	CardMedia,
} from '../';

describe( 'Card', () => {
	describe( 'Card component', () => {
		it( 'should render correctly', () => {
			const { container } = render(
				<Card>
					<CardHeader>Card Header</CardHeader>
					<CardBody>Card Body 1</CardBody>
					<CardBody>Card Body 2</CardBody>
					<CardDivider />
					<CardBody>Card Body 3</CardBody>
					<CardMedia>
						<img
							alt="Card Media"
							src="https://images.unsplash.com/photo-1566125882500-87e10f726cdc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1867&q=80"
						/>
					</CardMedia>
					<CardFooter>Card Footer</CardFooter>
				</Card>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'should remove borders when the isBorderless prop is true', () => {
			const { rerender } = render(
				<Card data-testid="card-wrapper">Code is Poetry</Card>
			);

			expect( screen.getByTestId( 'card-wrapper' ) ).not.toHaveStyle(
				'box-shadow: none'
			);

			rerender(
				<Card data-testid="card-wrapper" isBorderless>
					Code is Poetry
				</Card>
			);

			expect( screen.getByTestId( 'card-wrapper' ) ).toHaveStyle(
				'box-shadow: none'
			);
		} );

		it( 'should add rounded border when the isRounded prop is true', () => {
			render(
				<Card data-testid="card-rounded" isRounded>
					Code is Poetry
				</Card>
			);
			render(
				<Card data-testid="card-squared" isRounded={ false }>
					Code is Poetry
				</Card>
			);
			expect(
				screen.getByTestId( 'card-rounded' )
			).toMatchStyleDiffSnapshot( screen.getByTestId( 'card-squared' ) );
		} );

		it( 'should show a box shadow when the elevation prop is greater than 0', () => {
			const { container: withElevation } = render(
				<Card elevation={ 2 }>Code is Poetry</Card>
			);
			// The `elevation` prop has a default value of "0"
			const { container: withoutElevation } = render(
				<Card>Code is Poetry</Card>
			);

			expect( withElevation ).toMatchDiffSnapshot( withoutElevation );
		} );

		it( 'should add different amounts of white space when using the size prop', () => {
			// The `size` prop has a default value of "medium"
			const { container: withSizeDefault } = render(
				<Card>
					<CardHeader>Header</CardHeader>
					<CardBody>Code is Poetry</CardBody>
				</Card>
			);
			const { container: withSizeLarge } = render(
				<Card size="large">
					<CardHeader>Header</CardHeader>
					<CardBody>Code is Poetry</CardBody>
				</Card>
			);

			expect( withSizeDefault ).toMatchDiffSnapshot( withSizeLarge );
		} );

		it( 'should warn when the isElevated prop is passed', () => {
			// `isElevated` is automatically converted to `elevation="2"`
			const { container } = render(
				<Card isElevated>Code is Poetry</Card>
			);
			expect( container ).toMatchSnapshot();

			expect( console ).toHaveWarned();
		} );

		it( 'should pass the isBorderless and isSize props from its context to its sub-components', () => {
			const { container: withoutBorderLarge } = render(
				<Card isBorderless size="large">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			const { container: withBorderSmall } = render(
				<Card isBorderless={ false } size="small">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			expect( withoutBorderLarge ).toMatchDiffSnapshot( withBorderSmall );
		} );

		it( 'should get the isBorderless and isSize props (passed from its context) overriddenwhen the same props is specified directly on the component', () => {
			const { container: withoutBorder } = render(
				<Card isBorderless size="large">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			const { container: withBorder } = render(
				<Card isBorderless size="large">
					<CardHeader isBorderless={ false } size="small">
						Header
					</CardHeader>
					<CardBody size="medium">Body</CardBody>
					<CardFooter isBorderless={ false } size="xSmall">
						Footer
					</CardFooter>
				</Card>
			);
			expect( withoutBorder ).toMatchDiffSnapshot( withBorder );
		} );

		it( 'should support the legacy extraSmall value for the size prop as an alias for the xSmall value', () => {
			const { container: containerXSmall } = render(
				<Card size="xSmall">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			const { container: containerExtraSmall } = render(
				<Card size="extraSmall">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			expect( containerXSmall ).toMatchDiffSnapshot(
				containerExtraSmall
			);
		} );

		describe( 'CardHeader', () => {
			it( 'should render with a darker background color when isShady is true', () => {
				const { container } = render( <CardHeader>Header</CardHeader> );
				const { container: containerShady } = render(
					<CardHeader isShady>Header</CardHeader>
				);
				expect( container ).toMatchDiffSnapshot( containerShady );
			} );
		} );

		describe( 'CardFooter', () => {
			it( 'should render with a darker background color when isShady is true', () => {
				const { container } = render( <CardFooter>Footer</CardFooter> );
				const { container: containerShady } = render(
					<CardFooter isShady>Footer</CardFooter>
				);
				expect( container ).toMatchDiffSnapshot( containerShady );
			} );

			it( 'should use the justify prop to align its content, like a Flex container', () => {
				const { container } = render( <CardFooter>Footer</CardFooter> );
				const { container: containerWithFlexEnd } = render(
					<CardFooter justify="flex-end">Footer</CardFooter>
				);
				expect( container ).toMatchDiffSnapshot( containerWithFlexEnd );
			} );
		} );

		describe( 'CardBody', () => {
			it( 'should render with a darker background color when isShady is true', () => {
				const { container } = render( <CardBody>Body</CardBody> );
				const { container: containerShady } = render(
					<CardBody isShady>Body</CardBody>
				);
				expect( container ).toMatchDiffSnapshot( containerShady );
			} );

			it( 'should allow scrolling content with the scrollable prop is true', () => {
				const { container: containerScrollable } = render(
					<CardBody isScrollable>Body</CardBody>
				);
				const { container } = render( <CardBody>Body</CardBody> );
				expect( container ).toMatchDiffSnapshot( containerScrollable );
			} );
		} );

		describe( 'Custom padding props', () => {
			it( 'should apply custom paddingTop to CardBody', () => {
				const { container: withDefaultPadding } = render(
					<CardBody>Body</CardBody>
				);
				const { container: withCustomPaddingTop } = render(
					<CardBody paddingTop={ 8 }>Body</CardBody>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPaddingTop
				);
			} );

			it( 'should apply custom paddingRight to CardBody', () => {
				const { container: withDefaultPadding } = render(
					<CardBody>Body</CardBody>
				);
				const { container: withCustomPaddingRight } = render(
					<CardBody paddingRight={ 8 }>Body</CardBody>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPaddingRight
				);
			} );

			it( 'should apply custom paddingBottom to CardBody', () => {
				const { container: withDefaultPadding } = render(
					<CardBody>Body</CardBody>
				);
				const { container: withCustomPaddingBottom } = render(
					<CardBody paddingBottom={ 8 }>Body</CardBody>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPaddingBottom
				);
			} );

			it( 'should apply custom paddingLeft to CardBody', () => {
				const { container: withDefaultPadding } = render(
					<CardBody>Body</CardBody>
				);
				const { container: withCustomPaddingLeft } = render(
					<CardBody paddingLeft={ 8 }>Body</CardBody>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPaddingLeft
				);
			} );

			it( 'should apply multiple custom padding values to CardBody', () => {
				const { container: withDefaultPadding } = render(
					<CardBody>Body</CardBody>
				);
				const { container: withMultipleCustomPaddings } = render(
					<CardBody paddingTop={ 2 } paddingBottom={ 8 }>
						Body
					</CardBody>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withMultipleCustomPaddings
				);
			} );

			it( 'should apply custom padding to CardHeader', () => {
				const { container: withDefaultPadding } = render(
					<CardHeader>Header</CardHeader>
				);
				const { container: withCustomPadding } = render(
					<CardHeader paddingTop={ 8 } paddingLeft={ 10 }>
						Header
					</CardHeader>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPadding
				);
			} );

			it( 'should apply custom padding to CardFooter', () => {
				const { container: withDefaultPadding } = render(
					<CardFooter>Footer</CardFooter>
				);
				const { container: withCustomPadding } = render(
					<CardFooter paddingRight={ 12 } paddingBottom={ 4 }>
						Footer
					</CardFooter>
				);
				expect( withDefaultPadding ).toMatchDiffSnapshot(
					withCustomPadding
				);
			} );

			it( 'should pass custom padding from Card context to its sub-components', () => {
				const { container: withoutCustomPadding } = render(
					<Card>
						<CardHeader>Header</CardHeader>
						<CardBody>Body</CardBody>
						<CardFooter>Footer</CardFooter>
					</Card>
				);
				const { container: withCustomPadding } = render(
					<Card paddingTop={ 2 } paddingLeft={ 10 }>
						<CardHeader>Header</CardHeader>
						<CardBody>Body</CardBody>
						<CardFooter>Footer</CardFooter>
					</Card>
				);
				expect( withoutCustomPadding ).toMatchDiffSnapshot(
					withCustomPadding
				);
			} );

			it( 'should override Card context padding when specified directly on sub-component', () => {
				const { container: withContextPadding } = render(
					<Card paddingTop={ 2 }>
						<CardBody>Body</CardBody>
					</Card>
				);
				const { container: withOverriddenPadding } = render(
					<Card paddingTop={ 2 }>
						<CardBody paddingTop={ 8 }>Body</CardBody>
					</Card>
				);
				expect( withContextPadding ).toMatchDiffSnapshot(
					withOverriddenPadding
				);
			} );

			it( 'should work with size prop and custom padding together', () => {
				const { container: withSizeOnly } = render(
					<CardBody size="large">Body</CardBody>
				);
				const { container: withSizeAndCustomPadding } = render(
					<CardBody size="large" paddingTop={ 2 }>
						Body
					</CardBody>
				);
				expect( withSizeOnly ).toMatchDiffSnapshot(
					withSizeAndCustomPadding
				);
			} );

			it( 'should accept CSS values for custom padding', () => {
				const { container: withNumberValue } = render(
					<CardBody paddingTop={ 4 }>Body</CardBody>
				);
				const { container: withCSSValue } = render(
					<CardBody paddingTop="20px">Body</CardBody>
				);
				expect( withNumberValue ).toMatchDiffSnapshot( withCSSValue );
			} );
		} );
	} );
} );
