import { describe, expect, test } from 'vitest';
import type { CSSProperties } from 'react';
import { render, screen } from '@testing-library/react';
import { View } from '../../view';
import { Flex, FlexBlock, FlexItem } from '../';

function expectCustomProperty(
	testId: string,
	property: string,
	value: string
) {
	expect(
		getComputedStyle( screen.getByTestId( testId ) )
			.getPropertyValue( property )
			.trim()
	).toBe( value );
}

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Flex data-testid="base-flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		const flex = screen.getByTestId( 'base-flex' );
		expect( getComputedStyle( flex ).display ).toBe( 'flex' );
		expect( flex ).toHaveTextContent( 'ItemItem' );
	} );

	test( 'should render non Flex children', () => {
		render(
			<Flex data-testid="flex">
				<FlexItem>Item</FlexItem>
				<View data-testid="view-child" />
				<div data-testid="div-child" />
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		expect( screen.getByTestId( 'view-child' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'div-child' ) ).toBeInTheDocument();
	} );

	test( 'should render align', () => {
		render(
			<Flex align="flex-start" data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);
		expectCustomProperty(
			'flex',
			'--wp-components-flex-align',
			'flex-start'
		);
	} );

	test( 'should render justify', () => {
		render(
			<Flex justify="flex-start" data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);
		expectCustomProperty(
			'flex',
			'--wp-components-flex-justify',
			'flex-start'
		);
	} );

	test( 'should render spacing', () => {
		render(
			<Flex gap={ 5 } data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		expectCustomProperty(
			'flex',
			'--wp-components-flex-gap',
			'calc(4px * 5)'
		);
	} );

	test( 'should prefer generated flex styles over consumer CSS custom properties', () => {
		render(
			<Flex
				align="flex-start"
				data-testid="flex"
				style={
					{
						'--wp-components-flex-align': 'center',
					} as CSSProperties
				}
			>
				<FlexItem>Item</FlexItem>
			</Flex>
		);

		expectCustomProperty(
			'flex',
			'--wp-components-flex-align',
			'flex-start'
		);
	} );

	test( 'should render column direction', () => {
		render(
			<Flex direction="column" data-testid="flex">
				<FlexItem data-testid="flex-item">Item</FlexItem>
			</Flex>
		);

		expectCustomProperty( 'flex', '--wp-components-flex-align', 'normal' );
		expectCustomProperty(
			'flex',
			'--wp-components-flex-direction',
			'column'
		);
		expectCustomProperty(
			'flex-item',
			'--wp-components-flex-item-display',
			'block'
		);
	} );

	test( 'should render flex item display', () => {
		render(
			<Flex>
				<FlexItem display="inline-flex" data-testid="item">
					Item
				</FlexItem>
			</Flex>
		);

		expectCustomProperty(
			'item',
			'--wp-components-flex-item-display',
			'inline-flex'
		);
	} );

	test( 'should prefer generated flex item styles over consumer CSS custom properties', () => {
		render(
			<Flex>
				<FlexItem
					display="inline-flex"
					data-testid="item"
					style={
						{
							'--wp-components-flex-item-display': 'block',
						} as CSSProperties
					}
				>
					Item
				</FlexItem>
			</Flex>
		);

		expectCustomProperty(
			'item',
			'--wp-components-flex-item-display',
			'inline-flex'
		);
	} );
} );
