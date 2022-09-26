/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Divider } from '..';
import { Flex } from '../../flex';

const meta: ComponentMeta< typeof Divider > = {
	component: Divider,
	title: 'Components (Experimental)/Divider',
	argTypes: {
		margin: {
			control: { type: 'text' },
		},
		marginStart: {
			control: { type: 'text' },
		},
		marginEnd: {
			control: { type: 'text' },
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Divider > = ( args ) => (
	<div>
		<Text>Some text before the divider</Text>
		<Divider { ...args } />
		<Text>Some text after the divider</Text>
	</div>
);

export const Horizontal: ComponentStory< typeof Divider > = Template.bind( {} );
Horizontal.args = {
	margin: '2',
};

export const Vertical: ComponentStory< typeof Divider > = Template.bind( {} );
Vertical.args = {
	...Horizontal.args,
	orientation: 'vertical',
};

// Inside a `flex` container, the divider will need to be `stretch` aligned in order to be visible.
export const InFlexContainer: ComponentStory< typeof Divider > = ( args ) => {
	return (
		<Flex align="stretch">
			<Text>
				Some text before the divider Some text before the divider Some
				text before the divider Some text before the divider Some text
				before the divider Some text before the divider Some text before
				the divider
			</Text>
			<Divider { ...args } />
			<Text>
				Some text after the divider Some text after the divider Some
				text after the divider
			</Text>
		</Flex>
	);
};
InFlexContainer.args = {
	...Vertical.args,
};
