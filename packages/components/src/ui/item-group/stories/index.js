/* eslint-disable no-alert */
/* globals alert */
/**
 * External dependencies
 */
import { Avatar, Spacer } from '@wp-g2/components';

/**
 * Internal dependencies
 */
import { ItemGroup, Item } from '..';
import { HStack } from '../../h-stack';
import { View } from '../../view';
import { VStack } from '../../v-stack';
import { Text } from '../../text';
import { Popover } from '../../popover';
import { Button } from '../../button';

export default {
	component: ItemGroup,
	title: 'G2 Components (Experimental)/ItemGroup',
};

export const _default = () => (
	<ItemGroup css={ { width: '350px' } } bordered>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
		<Item action onClick={ () => alert( 'WordPress.org' ) }>
			Code is Poetry — Click me!
		</Item>
	</ItemGroup>
);

const ExampleItemContent = () => (
	<HStack spacing={ 3 }>
		<View>
			<Avatar name="WordPress" />
		</View>
		<Spacer>
			<VStack spacing={ 1 }>
				<Text weight="bold">Title</Text>
				<Text variant="muted">Description</Text>
			</VStack>
		</Spacer>
	</HStack>
);

export const nonAction = () => (
	<ItemGroup css={ { width: '350px' } } bordered rounded size="large">
		<Item>
			<ExampleItemContent />
		</Item>
		<Item>
			<ExampleItemContent />
		</Item>
		<Item>
			<ExampleItemContent />
		</Item>
	</ItemGroup>
);

export const dropdownMenu = () => (
	<Popover
		css={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup css={ { padding: 4 } }>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	</Popover>
);
/* eslint-enable no-alert */
