/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { Flex, FlexBlock, FlexItem } from '../';

describe( 'props', () => {
	let base;
	beforeEach( () => {
		base = render(
			<Flex>
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
	} );

	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render + wrap non Flex children', () => {
		const { container } = render(
			<Flex>
				<FlexItem />
				<View />
				<div />
				<FlexBlock />
			</Flex>
		);

		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Flex align="flex-start">
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render justify', () => {
		const { container } = render(
			<Flex justify="flex-start">
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render spacing', () => {
		const { container } = render(
			<Flex gap={ 5 }>
				<View />
				<View />
			</Flex>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
