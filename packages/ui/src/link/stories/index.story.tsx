import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../index';
import { Stack } from '../../stack';

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
		tone: 'brand',
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
				<span>Brand</span>
				<Link href="#" tone="brand">
					Learn more
				</Link>
			</Stack>
			<Stack direction="column" gap="xs">
				<span>Neutral</span>
				<Link href="#" tone="neutral">
					Learn more
				</Link>
			</Stack>
			<Stack direction="column" gap="xs">
				<span>Unstyled</span>
				<Link href="#" variant="unstyled">
					Learn more
				</Link>
			</Stack>
		</Stack>
	),
};

export const WithRenderProp: Story = {
	render: () => (
		<Link href="#" render={ <span /> }>
			A link rendered as a span
		</Link>
	),
};
