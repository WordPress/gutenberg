import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta< typeof Link > = {
	title: 'Components/@wordpress-ui/Link',
	id: 'design-system-components-link',
	component: Link,
	tags: [ 'manifest' ],
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Link >;

export const Default: Story = {
	args: {
		children: 'Learn more',
		href: '#',
	},
};

export const OpenInNewTab: Story = {
	args: {
		children: 'Visit WordPress.org',
		href: 'https://wordpress.org',
		openInNewTab: true,
	},
};

export const Wrapping: Story = {
	...OpenInNewTab,
	args: {
		...OpenInNewTab.args,
		children: 'Discover the terms and phrases',
	},
	render: ( args ) => (
		<Text
			variant="body-md"
			render={ <p /> }
			style={ { width: '24ch', textAlign: 'center' } }
		>
			<Link { ...args } /> your visitors use to find your site.
		</Text>
	),
};

export const Truncation: Story = {
	...OpenInNewTab,
	args: {
		...OpenInNewTab.args,
		children:
			'Discover the terms and phrases your visitors use to find your site.',
	},
	argTypes: {
		variant: { control: false },
	},
	render: ( args ) => (
		<Stack direction="row" gap="2xl">
			{ ( [ 'ltr', 'rtl' ] as const ).map( ( dir ) => (
				<Stack direction="column" gap="lg" dir={ dir } key={ dir }>
					<Text variant="heading-sm">{ dir.toUpperCase() }</Text>
					{ ( [ 'default', 'unstyled' ] as const ).map(
						( variant ) => (
							<Stack direction="column" gap="xs" key={ variant }>
								<Text variant="heading-sm">{ variant }</Text>
								<Text variant="body-sm">Ellipsis on Link</Text>
								<Text
									variant="body-md"
									render={
										<Link { ...args } variant={ variant } />
									}
									style={ {
										display: 'block',
										width: '24ch',
										overflow: 'hidden',
										whiteSpace: 'nowrap',
										textOverflow: 'ellipsis',
									} }
								>
									{ args.children }
								</Text>
								<Text variant="body-sm">
									Ellipsis on parent
								</Text>
								<Text
									variant="body-md"
									render={ <p /> }
									style={ {
										width: '24ch',
										overflow: 'hidden',
										whiteSpace: 'nowrap',
										textOverflow: 'ellipsis',
									} }
								>
									<Link { ...args } variant={ variant } />
								</Text>
							</Stack>
						)
					) }
				</Stack>
			) ) }
		</Stack>
	),
};

export const TruncationAtIcon: Story = {
	...Truncation,
	args: {
		...Truncation.args,
		children: 'Discover the terms and phrases',
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
 * When composing `Text` and `Link` via the `render` prop, keep `Text` as the
 * host and pass `Link` via `render` so the resulting element stays an `<a>`.
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
		<Text variant="body-md" render={ <Link { ...args } /> }>
			A standalone link with body-md typography
		</Text>
	),
};
