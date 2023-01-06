/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { ItemGroup } from '../item-group/component';
import { Item } from '../item/component';
import type { ItemProps } from '../types';

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
				children: 'Default non-clickable item',
			},
			{
				children: 'Clickable item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'WordPress.org' ),
			},
			{
				children: 'Item with hardcoded size="large"',
				size: 'large',
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};
