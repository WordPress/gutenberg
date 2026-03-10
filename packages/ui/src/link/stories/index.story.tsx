import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta< typeof Link > = {
	title: 'Design System/Components/Link',
	component: Link,
};
export default meta;

type Story = StoryObj< typeof Link >;

export const Default: Story = {
	args: {
		children: 'Learn more',
		href: '#',
	},
};

export const AllVariants: Story = {
	render: () => (
		<Stack
			direction="column"
			gap="lg"
			style={ { color: 'var(--wpds-color-fg-content-neutral)' } }
		>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm">Brand</Text>
				<Link href="#" tone="brand">
					Learn more
				</Link>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm">Neutral</Text>
				<Link href="#" tone="neutral">
					Learn more
				</Link>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm">Unstyled</Text>
				<Link href="#" variant="unstyled">
					Learn more
				</Link>
			</Stack>
		</Stack>
	),
};

export const Inline: Story = {
	render: () => (
		<Text variant="body-md" render={ <p /> }>
			This is a paragraph with an <Link href="#">inline link</Link> that
			inherits its typography from the parent Text component.
		</Text>
	),
};

export const Standalone: Story = {
	render: () => (
		<Stack direction="column" gap="md">
			<Text variant="body-md" render={ <Link href="#" /> }>
				A standalone link with body-md typography
			</Text>
			<Text variant="body-sm" render={ <Link href="#" tone="neutral" /> }>
				A standalone link with body-sm typography
			</Text>
		</Stack>
	),
};
