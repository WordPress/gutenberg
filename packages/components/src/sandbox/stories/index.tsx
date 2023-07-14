/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import SandBox from '..';

const meta: ComponentMeta< typeof SandBox > = {
	component: SandBox,
	title: 'Components/SandBox',
	argTypes: {
		onFocus: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof SandBox > = ( args ) => (
	<SandBox { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	html: '<p>Arbitrary HTML content</p>',
};
