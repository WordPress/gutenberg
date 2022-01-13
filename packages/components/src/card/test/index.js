/**
 * External dependencies
 */
import { render } from '@testing-library/react';

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
import { CONFIG } from '../../utils';

describe( 'Card', () => {
	describe( 'Card component', () => {
		it( 'should render correctly', () => {
			const wrapper = render(
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
			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should remove borders when the isBorderless prop is true', () => {
			const { rerender, container } = render(
				<Card>Code is Poetry</Card>
			);
			expect( container.firstChild ).not.toHaveStyle(
				'box-shadow: none'
			);

			rerender( <Card isBorderless={ true }>Code is Poetry</Card> );
			expect( container.firstChild ).toHaveStyle( 'box-shadow: none' );
		} );

		it( 'should add rounded border when the isRounded prop is true', () => {
			const { container } = render(
				<Card isRounded={ true }>Code is Poetry</Card>
			);
			expect( container.firstChild ).toHaveStyle( {
				borderRadius: CONFIG.cardBorderRadius,
			} );
		} );

		it( 'should show a box shadow when the elevation prop is greater than 0', () => {
			const { container: withElevation } = render(
				<Card elevation={ 2 }>Code is Poetry</Card>
			);
			// The `elevation` prop has a default value of "0"
			const { container: withoutElevation } = render(
				<Card>Code is Poetry</Card>
			);

			expect( withElevation.firstChild ).toMatchDiffSnapshot(
				withoutElevation.firstChild
			);
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

			expect( withSizeDefault.firstChild ).toMatchDiffSnapshot(
				withSizeLarge.firstChild
			);
		} );

		it( 'should warn when the isElevated prop is passed', () => {
			// `isElevated` is automatically converted to `elevation="2"`
			const { container } = render(
				<Card isElevated={ true }>Code is Poetry</Card>
			);
			expect( container ).toMatchSnapshot();

			expect( console ).toHaveWarned();
		} );

		it( 'should pass the isBorderless and isSize props from its context to its sub-components', () => {
			const { container: withoutBorderLarge } = render(
				<Card isBorderless={ true } size="large">
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
				<Card isBorderless={ true } size="large">
					<CardHeader>Header</CardHeader>
					<CardBody>Body</CardBody>
					<CardFooter>Footer</CardFooter>
				</Card>
			);
			const { container: withBorder } = render(
				<Card isBorderless={ true } size="large">
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
					<CardHeader isShady={ true }>Header</CardHeader>
				);
				expect( container ).toMatchDiffSnapshot( containerShady );
			} );
		} );

		describe( 'CardFooter', () => {
			it( 'should render with a darker background color when isShady is true', () => {
				const { container } = render( <CardFooter>Footer</CardFooter> );
				const { container: containerShady } = render(
					<CardFooter isShady={ true }>Footer</CardFooter>
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
					<CardBody isShady={ true }>Body</CardBody>
				);
				expect( container ).toMatchDiffSnapshot( containerShady );
			} );

			it( 'should allow scrolling content with the scrollable prop is true', () => {
				const { container: containerScrollable } = render(
					<CardBody isScrollable={ true }>Body</CardBody>
				);
				const { container } = render( <CardBody>Body</CardBody> );
				expect( container ).toMatchDiffSnapshot( containerScrollable );
			} );
		} );
	} );
} );
