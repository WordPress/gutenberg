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
	title: 'Design System/Components/Avatar',
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

export const BadgeContrastText: Story = {
	render: () => (
		<div style={ { display: 'flex', gap: '16px' } }>
			<Avatar
				src={ SAMPLE_AVATAR }
				name="Dark background"
				borderColor="#1D35B4"
				badge
			/>
			<Avatar
				src={ SAMPLE_AVATAR }
				name="Light background"
				borderColor="#FFF972"
				badge
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Badge text color adapts automatically based on the `borderColor` lightness to maintain WCAG AA contrast.',
			},
		},
	},
};

export const Dimmed: Story = {
	args: {
		...Default.args,
		dimmed: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'When `dimmed` is true, the avatar is desaturated and faded to indicate an inactive state.',
			},
		},
	},
};

export const DimmedWithIndicator: Story = {
	args: {
		...Default.args,
		dimmed: true,
		statusIndicator: moreHorizontal,
	},
	parameters: {
		docs: {
			description: {
				story: 'When `dimmed` is true and a `statusIndicator` is provided, the icon is rendered as an overlay.',
			},
		},
	},
};
