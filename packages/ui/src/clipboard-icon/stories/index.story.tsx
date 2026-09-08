import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipboardIcon } from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta< typeof ClipboardIcon > = {
	title: 'Design System/Components/ClipboardIcon',
	component: ClipboardIcon,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ClipboardIcon >;

export const Default: Story = {
	args: {
		status: 'pending',
	},
};

/**
 * The icon follows copy status: copy when pending, check when successful, and
 * an error mark when copying fails.
 */
export const Status: Story = {
	render: () => (
		<Stack direction="row" gap="lg" align="center">
			<Stack gap="xs" align="center">
				<ClipboardIcon status="pending" />
				<Text variant="body-sm">pending</Text>
			</Stack>
			<Stack gap="xs" align="center">
				<ClipboardIcon status="success" />
				<Text variant="body-sm">success</Text>
			</Stack>
			<Stack gap="xs" align="center">
				<ClipboardIcon status="error" />
				<Text variant="body-sm">error</Text>
			</Stack>
		</Stack>
	),
};
