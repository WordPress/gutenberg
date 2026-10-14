import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef } from '@wordpress/element';
import * as Avatar from '../index';
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
	args: {
		size: 'md',
		role: 'img',
		'aria-label': 'Alex Morgan',
	},
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image src={ IMAGE_SRC } alt="" />
		</Avatar.Root>
	),
};
export default meta;

type Story = StoryObj< typeof Avatar.Root >;

export const Default: Story = {};

/** Square avatars use the theme's corner radius for buttons and controls. */
export const Square: Story = {
	args: { shape: 'square' },
};

/** Supply initials as fallback content. */
export const FallbackOnly: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback>AM</Avatar.Fallback>
		</Avatar.Root>
	),
};

/** Omit fallback content to display the borderless person silhouette. */
export const IconFallback: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback />
		</Avatar.Root>
	),
};

/** Derive complete initials from a display name, or use the person silhouette. */
export const Initials: StoryObj< typeof Avatar.Initials > = {
	args: { name: 'Alex Morgan' },
	argTypes: {
		name: { control: 'text' },
		locale: { control: 'text' },
	},
	render: ( { name, locale, delay } ) => (
		<Avatar.Root role="img" aria-label={ name || 'Unknown person' }>
			<Avatar.Initials name={ name } locale={ locale } delay={ delay } />
		</Avatar.Root>
	),
};

/** Missing images display the fallback immediately despite a delay. */
export const MissingImage: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Initials name="Alex Morgan" delay={ 300 } />
			<Avatar.Image alt="" />
		</Avatar.Root>
	),
};

/** Decorative avatars retain their layout inside an admin tree item. */
export const InTree: Story = {
	render: ( args ) => (
		<div role="tree">
			<div role="treeitem">
				<Stack align="center" gap="sm">
					<Avatar.Root { ...args } aria-hidden="true">
						<Avatar.Initials name="Alex Morgan" />
					</Avatar.Root>
					<Text>Alex Morgan</Text>
				</Stack>
			</div>
		</div>
	),
};

/** An image that fails to load leaves the fallback visible. */
export const FailedImage: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image
				src="data:image/png;base64,invalid"
				alt=""
				keepMounted
			/>
		</Avatar.Root>
	),
};

export const Sizes: Story = {
	name: 'Sizes and shapes',
	render: ( args ) => (
		<Stack direction="column" gap="lg">
			{ ( [ 'circle', 'square' ] as const ).map( ( shape ) => (
				<Stack key={ shape } direction="column" gap="md">
					<Stack gap="md" align="center">
						{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map(
							( size ) => (
								<Avatar.Root
									{ ...args }
									key={ size }
									size={ size }
									shape={ shape }
								>
									<Avatar.Fallback delay={ 300 }>
										AM
									</Avatar.Fallback>
									<Avatar.Image src={ IMAGE_SRC } alt="" />
								</Avatar.Root>
							)
						) }
					</Stack>
					<Stack gap="md" align="center">
						{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map(
							( size ) => (
								<Avatar.Root
									{ ...args }
									key={ size }
									size={ size }
									shape={ shape }
								>
									<Avatar.Fallback>AM</Avatar.Fallback>
								</Avatar.Root>
							)
						) }
					</Stack>
					<Stack gap="md" align="center">
						{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map(
							( size ) => (
								<Avatar.Root
									{ ...args }
									key={ size }
									size={ size }
									shape={ shape }
								>
									<Avatar.Fallback />
								</Avatar.Root>
							)
						) }
					</Stack>
				</Stack>
			) ) }
		</Stack>
	),
};

/** Hide the avatar from assistive technology when the name is shown beside it. */
export const WithVisibleName: Story = {
	render: ( args ) => (
		<Stack gap="sm" align="center">
			<Avatar.Root { ...args } aria-hidden="true">
				<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
				<Avatar.Image src={ IMAGE_SRC } alt="" />
			</Avatar.Root>
			<Text>Alex Morgan</Text>
		</Stack>
	),
};

/** Use `keepMounted` to let the browser load the image lazily. */
export const LazyImage: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image src={ IMAGE_SRC } alt="" keepMounted loading="lazy" />
		</Avatar.Root>
	),
};

const ProfileImage = forwardRef<
	HTMLImageElement,
	React.ComponentProps< 'img' >
>( function UnforwardedProfileImage( props, ref ) {
	return <img alt="" { ...props } ref={ ref } />;
} );

/**
 * When passing a custom image component through `render`, forward the ref and
 * image props, including `onLoad` and `onError`, to the underlying image element.
 */
export const CustomImage: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image
				keepMounted
				render={ <ProfileImage src={ IMAGE_SRC } alt="" /> }
			/>
		</Avatar.Root>
	),
};

/** Pass a Gravatar URL to `Avatar.Image` through its `src` prop. */
export const Gravatar: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
			<Avatar.Image
				src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y&s=96"
				alt=""
				keepMounted
			/>
		</Avatar.Root>
	),
};
