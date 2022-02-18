/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Divider } from '..';

export default {
	component: Divider,
	title: 'Components (Experimental)/Divider',
	argTypes: {
		margin: {
			control: { type: 'number' },
		},
		marginStart: {
			control: { type: 'number' },
		},
		marginEnd: {
			control: { type: 'number' },
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
} as ComponentMeta< typeof Divider >;

const HorizontalTemplate: ComponentStory< typeof Divider > = ( args ) => (
	<div>
		<Text>Some text before the divider</Text>
		<Divider { ...args } />
		<Text>Some text after the divider</Text>
	</div>
);

const VerticalTemplate: ComponentStory< typeof Divider > = ( args ) => {
	const styles = {
		display: 'flex',
		alignItems: 'stretch',
		justifyContent: 'start',
	};

	return (
		<div style={ styles }>
			<Text>Some text before the divider</Text>
			<Divider { ...args } />
			<Text>Some text after the divider</Text>
		</div>
	);
};

export const Horizontal: ComponentStory<
	typeof Divider
> = HorizontalTemplate.bind( {} );
Horizontal.args = {
	margin: 2,
};

export const Vertical: ComponentStory< typeof Divider > = VerticalTemplate.bind(
	{}
);
Vertical.args = {
	...Horizontal.args,
	orientation: 'vertical',
};
