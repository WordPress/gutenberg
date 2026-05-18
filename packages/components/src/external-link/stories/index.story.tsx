/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ExternalLink from '..';

const meta: Meta< typeof ExternalLink > = {
	component: ExternalLink,
	title: 'Components/Navigation/ExternalLink',
	id: 'components-externallink',
	argTypes: {
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use `Link` from `@wordpress/ui` instead, with the `openInNewTab` prop set.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof ExternalLink > = ( { ...args } ) => {
	return <ExternalLink { ...args } />;
};

export const Default: StoryFn< typeof ExternalLink > = Template.bind( {} );
Default.args = {
	children: 'WordPress',
	href: 'https://wordpress.org',
};
