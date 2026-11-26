import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';
import * as Item from '../index';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Item/Usage Guidelines',
	id: 'design-system-components-item-usage-guidelines',
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' /* Hide individual story pages from sidebar */ ],
};
export default meta;

type Story = StoryObj;

/**
 * Uniform rows that users scan as a set are joined in one frame.
 */
export const Joined: Story = {
	render: () => (
		<Item.Group aria-label="Payments">
			<Item.LinkRow href="#card">
				<Item.Label>Card payments</Item.Label>
				<Item.Meta>
					<Badge intent="stable">Enabled</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>
			<Item.LinkRow href="#bank">
				<Item.Label>Bank transfer</Item.Label>
				<Item.Meta>
					<Badge>Inactive</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>
		</Item.Group>
	),
};

/**
 * Rows that are each a self-contained object are detached, but stay one
 * list.
 */
export const Detached: Story = {
	render: () => (
		<Item.Group aria-label="Connectors" variant="detached">
			<Item.ContentRow>
				<Item.Label>Akismet Anti-spam</Item.Label>
				<Item.Description>
					Protect your site from spam.
				</Item.Description>
				<Item.Actions>
					<Button
						variant="outline"
						size="compact"
						aria-label="Set up Akismet Anti-spam"
					>
						Set up
					</Button>
				</Item.Actions>
			</Item.ContentRow>
			<Item.ContentRow>
				<Item.Label>Anthropic</Item.Label>
				<Item.Description>
					Text generation with Claude.
				</Item.Description>
				<Item.Actions>
					<Button
						variant="outline"
						size="compact"
						aria-label="Install Anthropic"
					>
						Install
					</Button>
				</Item.Actions>
			</Item.ContentRow>
		</Item.Group>
	),
};

/**
 * Rows that belong to different sections go in separate groups, each named
 * by its own heading.
 */
export const SeparateGroups: Story = {
	render: () => (
		<Stack direction="column" gap="xl">
			<Stack direction="column" gap="sm">
				<Text variant="heading-md" render={ <h3 /> } id="access">
					Access
				</Text>
				<Item.Group aria-labelledby="access">
					<Item.LinkRow href="#collaborators">
						<Item.Label>Collaborators</Item.Label>
						<Item.Chevron />
					</Item.LinkRow>
					<Item.LinkRow href="#moderation">
						<Item.Label>Moderation options</Item.Label>
						<Item.Chevron />
					</Item.LinkRow>
				</Item.Group>
			</Stack>
			<Stack direction="column" gap="sm">
				<Text variant="heading-md" render={ <h3 /> } id="automation">
					Automation
				</Text>
				<Item.Group aria-labelledby="automation">
					<Item.LinkRow href="#webhooks">
						<Item.Label>Webhooks</Item.Label>
						<Item.Chevron />
					</Item.LinkRow>
				</Item.Group>
			</Stack>
		</Stack>
	),
};
