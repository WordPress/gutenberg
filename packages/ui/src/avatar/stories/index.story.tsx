import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef } from '@wordpress/element';
import { commentAuthorAvatar } from '@wordpress/icons';
import * as Avatar from '../index';
import { Icon } from '../../icon';
import { Stack } from '../../stack';
import { Text } from '../../text';

// Profile illustration by Boxicons: https://unsplash.com/illustrations/simple-black-outline-of-a-person-icon-s4_txsqJZ7M
const IMAGE_SRC =
	'https://images.unsplash.com/vector-1776244476031-db2aa624a2a0?w=128&h=128&fit=crop&fm=jpg';

const meta: Meta< typeof Avatar.Root > = {
	title: 'Components/@wordpress-ui/Avatar',
	id: 'design-system-components-avatar',
	component: Avatar.Root,
	subcomponents: {
		'Avatar.Image': Avatar.Image,
		'Avatar.Fallback': Avatar.Fallback,
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

/** Supply a profile icon from `@wordpress/icons` as fallback content. */
export const IconFallback: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback>
				<Icon
					icon={ commentAuthorAvatar }
					style={ {
						inlineSize: '75%',
						blockSize: '75%',
					} }
				/>
			</Avatar.Fallback>
		</Avatar.Root>
	),
};

/**
 * Use an unframed fallback for an icon that already has its own outline.
 * The fallback keeps its natural size; the root's size and shape apply when an
 * image loads. Keep the fallback directly inside `Avatar.Root`.
 */
export const UnframedFallback: Story = {
	render: ( args ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback variant="unframed">
				<Icon icon={ commentAuthorAvatar } />
			</Avatar.Fallback>
		</Avatar.Root>
	),
};

/**
 * Prefer the image even when the name is missing. Supply initials for named
 * authors and a standalone icon when initials cannot be computed. Avatar owns
 * image loading and failures; the application chooses the fallback content.
 * These examples cover loaded, failed, and missing images for both cases.
 */
export const AuthorFallbacks: Story = {
	name: 'Author images and fallbacks',
	render: ( args ) => (
		<Stack direction="column" gap="lg">
			{ [
				{ name: 'Alex Morgan', src: IMAGE_SRC, state: 'Loaded image' },
				{
					name: 'Alex Morgan',
					src: 'data:image/png;base64,invalid',
					state: 'Failed image',
				},
				{ name: 'Alex Morgan', src: undefined, state: 'Missing image' },
				{ name: undefined, src: IMAGE_SRC, state: 'Loaded image' },
				{
					name: undefined,
					src: 'data:image/png;base64,invalid',
					state: 'Failed image',
				},
				{ name: undefined, src: undefined, state: 'Missing image' },
			].map( ( { name, src, state } ) => {
				const initials = name
					?.trim()
					.split( /\s+/ )
					.slice( 0, 2 )
					.map( ( word ) => Array.from( word )[ 0 ] )
					.join( '' )
					.toUpperCase();
				return (
					<Stack
						key={ `${ name }-${ state }` }
						gap="sm"
						align="center"
					>
						<Avatar.Root { ...args } aria-hidden="true">
							<Avatar.Fallback
								variant={ initials ? 'default' : 'unframed' }
							>
								{ initials || (
									<Icon icon={ commentAuthorAvatar } />
								) }
							</Avatar.Fallback>
							<Avatar.Image src={ src } alt="" keepMounted />
						</Avatar.Root>
						<Text>{ name || 'Unnamed author' }</Text>
						<Text>{ state }</Text>
					</Stack>
				);
			} ) }
		</Stack>
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
