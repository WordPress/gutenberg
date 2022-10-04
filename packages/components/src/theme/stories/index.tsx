/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Theme from '../index';
import Button from '../../button';

const meta: ComponentMeta< typeof Theme > = {
	component: Theme,
	title: 'Components (Experimental)/Theme',
	argTypes: {
		accent: { control: { type: 'color' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Theme > = ( args ) => (
	<Theme { ...args }>
		<Button variant="primary">Hello</Button>
	</Theme>
);

export const Default = Template.bind( {} );
Default.args = {
	accent: '#00006b',
};

export const Nested: ComponentStory< typeof Theme > = ( args ) => (
	<Theme accent="tomato">
		<Button variant="primary">Outer theme</Button>

		<Theme { ...args }>
			<Button variant="primary">Inner theme</Button>
		</Theme>
	</Theme>
);
Nested.args = {
	accent: 'blue',
};
