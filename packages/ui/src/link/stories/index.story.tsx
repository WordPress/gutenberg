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

/**
 * Note: `tone` has no effect on `unstyled` variant
 */
export const AllTonesAndVariants: Story = {
	...Default,
	argTypes: {
		tone: {
			control: false,
		},
		variant: {
			control: false,
		},
	},
	render: ( args ) => (
		<Stack direction="column" gap="lg">
			{ ( [ 'brand', 'neutral' ] as const ).map( ( tone ) =>
				( [ 'default', 'unstyled' ] as const ).map( ( variant ) => (
					<Stack
						direction="column"
						gap="xs"
						key={ `${ tone }-${ variant }` }
					>
						<Text variant="heading-sm">
							{ tone } tone, { variant } variant
						</Text>
						<Link { ...args } tone={ tone } variant={ variant } />
					</Stack>
				) )
			) }
		</Stack>
	),
};

export const Inline: Story = {
	...Default,
	args: {
		...Default.args,
		children: 'inline link',
	},
	render: ( args ) => (
		<Text variant="body-md" render={ <p /> }>
			This is a paragraph with an <Link { ...args } /> that inherits its
			typography from the parent Text component.
		</Text>
	),
};

/**
 * When composing `Text` and `Link` via the `render` prop, the order matters:
 * - `<Text render={ <Link /> } />` renders an `<a>` element (Link's default tag wins).
 * - `<Link render={ <Text /> } />` renders a `<span>` element (Text's default tag wins).
 */
export const Standalone: Story = {
	args: {
		href: '#',
	},
	argTypes: {
		children: {
			control: false,
		},
	},
	render: ( args ) => (
		<Stack direction="column" gap="md">
			<Text variant="body-md" render={ <Link { ...args } /> }>
				A standalone link with body-md typography
			</Text>
			<Text variant="body-sm" render={ <Link { ...args } /> }>
				A standalone link with body-sm typography
			</Text>
		</Stack>
	),
};
