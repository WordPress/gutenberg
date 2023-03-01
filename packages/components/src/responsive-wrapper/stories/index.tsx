/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import ResponsiveWrapper from '..';

const meta: ComponentMeta< typeof ResponsiveWrapper > = {
	component: ResponsiveWrapper,
	title: 'Components/ResponsiveWrapper',
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ResponsiveWrapper > = ( args ) => (
	<ResponsiveWrapper { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	naturalWidth: 2000,
	naturalHeight: 680,
	children: (
		<img
			src="https://s.w.org/style/images/about/WordPress-logotype-standard.png"
			alt="WordPress"
		/>
	),
};
