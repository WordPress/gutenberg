/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { ItemGroup } from '../item-group/component';
import { Item } from '../item/component';

type ItemProps = React.ComponentPropsWithoutRef< typeof Item >;

const meta: ComponentMeta< typeof ItemGroup > = {
	component: ItemGroup,
	title: 'Components (Experimental)/ItemGroup',
	subcomponents: { Item },
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const mapPropsToItem = ( props: ItemProps, index: number ) => (
	<Item { ...props } key={ index } />
);

const Template: ComponentStory< typeof ItemGroup > = ( props ) => (
	<ItemGroup { ...props } />
);

export const Default: ComponentStory< typeof ItemGroup > = Template.bind( {} );
Default.args = {
	children: (
		[
			{
				children: 'First item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'First item clicked' ),
			},
			{
				children: 'Second item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'Second item clicked' ),
			},
			{
				children: 'Third item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'Third item clicked' ),
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const NonClickableItems: ComponentStory< typeof ItemGroup > =
	Template.bind( {} );
NonClickableItems.args = {
	children: (
		[
			{
				children:
					"This <Item /> is not click-able because it doesn't have an `onClick` prop",
			},
			{
				children:
					"This <Item /> is also not click-able because it doesn't have an `onClick` prop",
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const CustomItemSize: ComponentStory< typeof ItemGroup > = Template.bind(
	{}
);
CustomItemSize.args = {
	children: (
		[
			{
				children:
					'This <Item /> will inherit the size from <ItemGroup /> (try changing the size prop)',
			},
			{
				children:
					'This <Item /> has a hardcoded size="large", regardless of <ItemGroup />\'s size',
				size: 'large',
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const WithBorder: ComponentStory< typeof ItemGroup > = Template.bind(
	{}
);
WithBorder.args = {
	...Default.args,
	isBordered: true,
	isSeparated: true,
};
