/**
 * Internal dependencies
 */
import Flex from '../flex';
import FlexItem from '../flex-item';
import View from '../../../view';

export default {
	component: Flex,
	title: 'Components/G2/Flex',
};

export const _default = () => {
	return (
		<>
			<Flex gap={ 3 }>
				<View>Item</View>
				<View>Item</View>
			</Flex>
			<Flex direction={ [ 'column', 'row' ] } gap={ 3 }>
				<View css={ { width: '180px' } }>Item</View>
				<FlexItem isBlock>
					<View>Item</View>
				</FlexItem>
				<View>Item</View>
				<View>Item</View>
			</Flex>
		</>
	);
};
