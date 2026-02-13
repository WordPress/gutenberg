/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

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

export const SmallWithBorderColor: Story = {
	args: {
		...Default.args,
		size: 'small',
		borderColor: '#3858e9',
	},
};

export const NoImage: Story = {
	args: {
		name: 'No Image',
	},
};
