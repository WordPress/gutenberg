/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Flex, FlexBlock, FlexItem } from '../';

const getGeneratedEmotionClassNames = ( element: HTMLElement ) =>
	Array.from( element.classList ).filter( ( className ) =>
		/^(css|emotion)-/.test( className )
	);

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		expect( screen.getByTestId( 'base-flex' ) ).toMatchSnapshot();
	} );

	test( 'should render + wrap non Flex children', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		render(
			<Flex data-testid="flex">
				<FlexItem>Item</FlexItem>
				<View />
				<div />
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		expect( screen.getByTestId( 'flex' ) ).toMatchDiffSnapshot(
			screen.getByTestId( 'base-flex' )
		);
	} );

	test( 'should render align', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		render(
			<Flex align="flex-start" data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);
		expect( screen.getByTestId( 'flex' ) ).toMatchStyleDiffSnapshot(
			screen.getByTestId( 'base-flex' )
		);
	} );

	test( 'should render justify', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		render(
			<Flex justify="flex-start" data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);
		expect( screen.getByTestId( 'flex' ) ).toMatchStyleDiffSnapshot(
			screen.getByTestId( 'base-flex' )
		);
	} );

	test( 'should render spacing', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		render(
			<>
				<Flex>
					<FlexItem>Item</FlexItem>
					<FlexBlock data-testid="flex-block">Item</FlexBlock>
				</Flex>
				<Flex gap={ 5 }>
					<FlexItem>Item</FlexItem>
					<FlexBlock data-testid="flex-block-with-gap">
						Item
					</FlexBlock>
				</Flex>
			</>
		);
		expect( screen.getByTestId( 'flex-block' ) ).toMatchStyleDiffSnapshot(
			screen.getByTestId( 'flex-block-with-gap' )
		);
	} );

	test( 'should compose flex item styles in a single generated class', () => {
		render(
			<Flex>
				<FlexItem isBlock display="inline-flex" data-testid="item">
					Item
				</FlexItem>
			</Flex>
		);

		const item = screen.getByTestId( 'item' );

		expect( getGeneratedEmotionClassNames( item ) ).toHaveLength( 1 );
		expect( item ).toHaveStyle( { display: 'inline-flex' } );
	} );
} );
