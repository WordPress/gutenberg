import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../index';
import { Stack } from '../../stack';

const meta: Meta< typeof Badge > = {
	title: 'Design System/Components/Badge/Choosing intent',
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
