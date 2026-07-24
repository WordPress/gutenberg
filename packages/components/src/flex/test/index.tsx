import type { CSSProperties } from 'react';
import { render, screen } from '@testing-library/react';

import { View } from '../../view';
import { Flex, FlexBlock, FlexItem } from '../';

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
		expect( screen.getByTestId( 'flex' ) ).toHaveStyle( {
			'--wp-components-flex-align': 'flex-start',
		} );
	} );

	test( 'should render justify', () => {
		render(
			<Flex justify="flex-start" data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);
		expect( screen.getByTestId( 'flex' ) ).toHaveStyle( {
			'--wp-components-flex-justify': 'flex-start',
		} );
	} );

	test( 'should render spacing', () => {
		render(
			<Flex gap={ 5 } data-testid="flex">
				<FlexItem>Item</FlexItem>
				<FlexBlock>Item</FlexBlock>
			</Flex>
		);

		expect( screen.getByTestId( 'flex' ) ).toHaveStyle( {
			'--wp-components-flex-gap': 'calc(4px * 5)',
		} );
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

		expect( screen.getByTestId( 'flex' ) ).toHaveStyle( {
			'--wp-components-flex-align': 'flex-start',
		} );
	} );

	test( 'should render column direction', () => {
		render(
			<Flex direction="column" data-testid="flex">
				<FlexItem data-testid="flex-item">Item</FlexItem>
			</Flex>
		);

		expect( screen.getByTestId( 'flex' ) ).toHaveStyle( {
			'--wp-components-flex-align': 'normal',
			'--wp-components-flex-direction': 'column',
		} );
		expect( screen.getByTestId( 'flex-item' ) ).toHaveStyle( {
			'--wp-components-flex-item-display': 'block',
		} );
	} );

	test( 'should render flex item display', () => {
		render(
			<Flex>
				<FlexItem display="inline-flex" data-testid="item">
					Item
				</FlexItem>
			</Flex>
		);

		expect( screen.getByTestId( 'item' ) ).toHaveStyle( {
			'--wp-components-flex-item-display': 'inline-flex',
		} );
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

		expect( screen.getByTestId( 'item' ) ).toHaveStyle( {
			'--wp-components-flex-item-display': 'inline-flex',
		} );
	} );
} );
