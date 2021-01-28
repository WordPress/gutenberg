/**
 * Internal dependencies
 */
import { Placeholder, Spacer } from '../../index';
import { Flex, FlexItem } from '../index';

export default {
	component: Flex,
	title: 'Components/Flex',
};

const ItemView = ( props ) => <Placeholder { ...props } />;

export const _default = () => {
	return (
		<>
			<Spacer mb={ 4 }>
				<Flex gap={ 3 }>
					<ItemView>Item</ItemView>
					<ItemView>Item</ItemView>
				</Flex>
			</Spacer>
			<Flex direction={ [ 'column', 'row' ] } gap={ 3 }>
				<ItemView css={ { width: '180px' } }>Item</ItemView>
				<FlexItem isBlock>
					<ItemView>Item</ItemView>
				</FlexItem>
				<ItemView>Item</ItemView>
				<ItemView>Item</ItemView>
			</Flex>
		</>
	);
};
