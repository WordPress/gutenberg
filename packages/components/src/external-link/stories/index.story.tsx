/**
 * External dependencies
 */
import type { Meta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import ExternalLink from '..';

const meta: Meta< typeof ExternalLink > = {
	component: ExternalLink,
	title: 'Components/ExternalLink',
	argTypes: {
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ExternalLink > = ( { ...args } ) => {
	return <ExternalLink { ...args } />;
};

export const Default: ComponentStory< typeof ExternalLink > = Template.bind(
	{}
);
Default.args = {
	children: 'WordPress',
	href: 'https://wordpress.org',
};
