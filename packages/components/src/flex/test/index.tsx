/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Flex, FlexBlock, FlexItem } from '../';

describe( 'props', () => {
	test( 'should apply base flex and flex-block layout styles', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock data-testid="flex-block">Item</FlexBlock>
			</Flex>
		);

		const flexStyles = window.getComputedStyle(
			screen.getByTestId( 'base-flex' )
		);
		const flexBlockStyles = window.getComputedStyle(
			screen.getByTestId( 'flex-block' )
		);

		expect( flexStyles.alignItems ).toBe( 'center' );
		expect( flexStyles.display ).toBe( 'flex' );
		expect( flexStyles.gap ).toBe( 'calc(4px * 2)' );
		expect( flexStyles.justifyContent ).toBe( 'space-between' );
		expect( flexStyles.width ).toBe( '100%' );

		expect( flexBlockStyles.display ).toBe( 'block' );
		expect( flexBlockStyles.flex ).toBe( '1 1 0%' );
		expect( flexBlockStyles.minHeight ).toBe( '0' );
		expect( flexBlockStyles.minWidth ).toBe( '0' );
	} );

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
} );
