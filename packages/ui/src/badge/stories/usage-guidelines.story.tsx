import type { Meta, StoryObj } from '@storybook/react-vite';
import { caution, error, page, plugins, published } from '@wordpress/icons';
import { Badge } from '../index';
import { Icon } from '../../icon';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta< typeof Badge > = {
	title: 'Design System/Components/Badge/Usage Guidelines',
	component: Badge,
	decorators: [
		( Story ) => (
			<Stack direction="row" gap="sm" wrap="wrap">
				<Story />
			</Stack>
		),
	],
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' /* Hide individual story pages from sidebar */ ],
};
export default meta;

type Story = StoryObj< typeof Badge >;

export const AllIntents: Story = {
	render: () => (
		<>
			<Badge intent="high">high</Badge>
			<Badge intent="medium">medium</Badge>
			<Badge intent="low">low</Badge>
			<Badge intent="stable">stable</Badge>
			<Badge intent="informational">informational</Badge>
			<Badge intent="draft">draft</Badge>
			<Badge intent="none">none</Badge>
		</>
	),
};

export const High: Story = {
	render: () => (
		<>
			<Badge intent="high">Payment declined</Badge>
			<Badge intent="high">Security issue</Badge>
		</>
	),
};

export const Medium: Story = {
	render: () => (
		<>
			<Badge intent="medium">Approval required</Badge>
			<Badge intent="medium">Review needed</Badge>
		</>
	),
};

export const Low: Story = {
	render: () => (
		<>
			<Badge intent="low">Pending</Badge>
			<Badge intent="low">Queued</Badge>
		</>
	),
};

export const Informational: Story = {
	render: () => (
		<>
			<Badge intent="informational">Scheduled</Badge>
			<Badge intent="informational">Beta</Badge>
		</>
	),
};

export const Draft: Story = {
	render: () => (
		<>
			<Badge intent="draft">Draft</Badge>
			<Badge intent="draft">Unpublished</Badge>
		</>
	),
};

export const Stable: Story = {
	render: () => (
		<>
			<Badge intent="stable">Healthy</Badge>
			<Badge intent="stable">Active</Badge>
		</>
	),
};

export const None: Story = {
	render: () => (
		<>
			<Badge intent="none">Inactive</Badge>
			<Badge intent="none">Expired</Badge>
		</>
	),
};

export const CommentStatus: Story = {
	render: () => (
		<>
			<Badge intent="none">Approved</Badge>
			<Badge intent="medium">Approval required</Badge>
		</>
	),
};

export const PageStatus: Story = {
	render: () => (
		<>
			<Badge intent="none">Published</Badge>
			<Badge intent="low">Pending</Badge>
			<Badge intent="draft">Draft</Badge>
			<Badge intent="informational">Scheduled</Badge>
			<Badge intent="informational">Private</Badge>
		</>
	),
};

export const PluginStatus: Story = {
	render: () => (
		<>
			<Badge intent="stable">Active</Badge>
			<Badge intent="none">Inactive</Badge>
		</>
	),
};

export const TextOnlyBadges: Story = {
	render: () => (
		<>
			<Badge intent="stable">Active</Badge>
			<Badge intent="medium">Review needed</Badge>
			<Badge intent="high">Payment declined</Badge>
		</>
	),
};

export const WithAdjacentContentIcon: Story = {
	render: () => (
		<Stack direction="column" gap="sm">
			<Stack direction="row" gap="sm" align="center">
				<Icon icon={ page } size={ 24 } />
				<Text variant="body-md">About page</Text>
				<Badge intent="none">Published</Badge>
			</Stack>
			<Stack direction="row" gap="sm" align="center">
				<Icon icon={ plugins } size={ 24 } />
				<Text variant="body-md">My Plugin</Text>
				<Badge intent="stable">Active</Badge>
			</Stack>
		</Stack>
	),
};

export const IncorrectBadgeWithIcon: Story = {
	render: () => (
		<>
			{ /* @ts-expect-error Demonstrating incorrect Badge usage with icon children. */ }
			<Badge intent="stable">
				<Stack
					align="center"
					direction="row"
					gap="xs"
					render={ <span /> }
				>
					<Icon icon={ published } size={ 16 } />
					Active
				</Stack>
			</Badge>
			{ /* @ts-expect-error Demonstrating incorrect Badge usage with icon children. */ }
			<Badge intent="medium">
				<Stack
					align="center"
					direction="row"
					gap="xs"
					render={ <span /> }
				>
					<Icon icon={ caution } size={ 16 } />
					Review needed
				</Stack>
			</Badge>
			{ /* @ts-expect-error Demonstrating incorrect Badge usage with icon children. */ }
			<Badge intent="high">
				<Stack
					align="center"
					direction="row"
					gap="xs"
					render={ <span /> }
				>
					<Icon icon={ error } size={ 16 } />
					Payment declined
				</Stack>
			</Badge>
		</>
	),
};
