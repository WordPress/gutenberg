import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Avatar from '../index';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';

// Profile illustration by Masantocreative: https://unsplash.com/illustrations/someone-is-thinking-and-strategizing-with-their-brain-1L--AMFSThk
// Used under the Unsplash License: https://unsplash.com/license
const IMAGE_SRC =
	'https://images.unsplash.com/vector-1753200161282-0c2bef060ac4?w=128&h=128&fit=crop&fm=jpg';

const meta: Meta< typeof Avatar.Root > = {
	title: 'Components/@wordpress-ui/Avatar',
	id: 'design-system-components-avatar',
	component: Avatar.Root,
	subcomponents: {
		'Avatar.Image': Avatar.Image,
		'Avatar.Fallback': Avatar.Fallback,
		'Avatar.Initials': Avatar.Initials,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Avatar.Root >;

export const Default: Story = {
	args: {
		'aria-label': 'Alex Morgan',
		role: 'img',
	},
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image src={ IMAGE_SRC } alt="" />
		</Avatar.Root>
	),
};

/** Apply the same color to image rings, initials, and person fallbacks. */
export const WithColor: Story = {
	...Default,
	args: { ...Default.args, color: '#008a20' },
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar.Root { ...args }>
				<Avatar.Fallback />
				<Avatar.Image src={ IMAGE_SRC } alt="" />
			</Avatar.Root>
			<Avatar.Root { ...args }>
				<Avatar.Initials name="Alex Morgan" />
			</Avatar.Root>
			<Avatar.Root { ...args }>
				<Avatar.Fallback />
			</Avatar.Root>
		</Stack>
	),
};

/** Wrap a decorative avatar in a button to make it interactive. */
export const Interactive: Story = {
	render: ( args ) => (
		<Button
			variant="unstyled"
			aria-label="Open Alex Morgan's profile"
			style={ {
				display: 'inline-flex',
				borderRadius:
					args.shape === 'square'
						? 'var(--wpds-border-radius-sm)'
						: '50%',
			} }
		>
			<Avatar.Root { ...args } aria-hidden="true">
				<Avatar.Initials name="Alex Morgan" />
			</Avatar.Root>
		</Button>
	),
};

/** Omit fallback content to display the person icon. */
export const IconFallback: Story = {
	...Default,
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback />
		</Avatar.Root>
	),
};

/** Derive initials from a display name. */
export const Initials: Story = {
	...Default,
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Initials name="Alex Morgan" />
		</Avatar.Root>
	),
};

/** Hide the avatar from assistive technology when the name is shown beside it. */
export const WithVisibleName: Story = {
	render: ( args ) => (
		<Stack gap="sm" align="center">
			<Avatar.Root { ...args } aria-hidden="true">
				<Avatar.Initials name="Alex Morgan" />
			</Avatar.Root>
			<Text>Alex Morgan</Text>
		</Stack>
	),
};
