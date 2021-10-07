/**
 * Internal dependencies
 */
import { Flex, FlexItem } from '../';
import { View } from '../../view';

export default {
	component: Flex,
	title: 'Components (Experimental)/Flex',
};

export const _default = () => {
	return (
		<>
			<Flex gap={ 3 }>
				<View>Item</View>
				<View>Item</View>
			</Flex>
			<Flex direction={ [ 'column', 'row' ] } gap={ 3 }>
				<View style={ { width: '180px' } }>Item</View>
				<FlexItem isBlock>
					<View>Item</View>
				</FlexItem>
				<View>Item</View>
				<View>Item</View>
			</Flex>
		</>
	);
};
