/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { View } from '../../View';
import Flex, { FlexBlock, FlexItem } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Flex>
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
		expect( container.firstChild ).toMatchSnapshot();
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
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Flex align="flex-start">
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render justify', () => {
		const { container } = render(
			<Flex justify="flex-start">
				<FlexItem />
				<FlexBlock />
			</Flex>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render spacing', () => {
		const { container } = render(
			<Flex spacing={ 5 }>
				<View />
				<View />
			</Flex>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
