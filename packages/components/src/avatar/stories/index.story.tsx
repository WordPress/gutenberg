/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { moreHorizontal } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Avatar from '..';

const meta: Meta< typeof Avatar > = {
	component: Avatar,
	title: 'Components/Containers/Avatar',
	id: 'components-avatar',
	tags: [ 'status-private' ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Private API. Only available for internal WordPress core usage.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

const SAMPLE_AVATAR =
	'https://gravatar.com/avatar/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?s=96&d=identicon';

export const Default: Story = {
	args: {
		src: SAMPLE_AVATAR,
		name: 'Jane Doe',
	},
};

export const WithBorderColor: Story = {
	args: {
		...Default.args,
		borderColor: '#3858e9',
	},
};

export const Small: Story = {
	args: {
		...Default.args,
		size: 'small',
	},
};

export const Initials: Story = {
	args: {
		name: 'Tanner Robinson',
	},
};

export const Badge: Story = {
	args: {
		...WithBorderColor.args,
		badge: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'When `badge` is true, hovering the avatar expands a pill that reveals the name. Use the `label` prop to override the visible text.',
			},
		},
	},
};

export const WithLabel: Story = {
	args: {
		...WithBorderColor.args,
		badge: true,
		label: 'You',
	},
};

export const Active: Story = {
	args: {
		...Default.args,
		status: 'active',
		statusIndicator: moreHorizontal,
	},
	parameters: {
		docs: {
			description: {
				story: 'When `status` is set, the avatar image is dimmed and the `statusIndicator` is rendered as an overlay.',
			},
		},
	},
};

export const Idle: Story = {
	args: {
		...Default.args,
		status: 'idle',
	},
};
