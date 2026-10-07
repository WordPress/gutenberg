import type { Meta, StoryObj } from '@storybook/react-vite';
import { cloneElement, forwardRef, renderToString } from '@wordpress/element';
import { commentAuthorAvatar, wordpress } from '@wordpress/icons';
import * as Avatar from '../index';
import { Button } from '../../button';
import { Icon } from '../../icon';
import { Stack } from '../../stack';
import { Text } from '../../text';
import * as Tooltip from '../../tooltip';

const IMAGE_SRC = `data:image/svg+xml,${ encodeURIComponent(
	renderToString(
		cloneElement( wordpress, { style: { background: '#fff' } } )
	)
) }`;

type StoryArgs = React.ComponentProps< typeof Avatar.Root > &
	Pick< React.ComponentProps< typeof Avatar.Image >, 'src' > &
	Pick< React.ComponentProps< typeof Avatar.Fallback >, 'delay' > & {
		fallback: React.ReactNode;
	};

const meta: Meta< StoryArgs > = {
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
	argTypes: {
		size: { control: 'select', options: [ 'xs', 'sm', 'md', 'lg', 'xl' ] },
		src: { control: 'text' },
		fallback: { control: 'text' },
		delay: { control: { type: 'number', min: 0, step: 50 } },
	},
	args: {
		size: 'md',
		src: IMAGE_SRC,
		fallback: 'WP',
		delay: 300,
		role: 'img',
		'aria-label': 'WordPress',
	},
	render: ( { src, fallback, delay, ...args } ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
			<Avatar.Image src={ src } alt="" />
		</Avatar.Root>
	),
};
export default meta;

type Story = StoryObj< StoryArgs >;

export const Default: Story = {};

/** Supply fallback content directly. The component does not generate initials. */
export const FallbackOnly: Story = {
	args: {
		src: undefined,
		fallback: 'AM',
		delay: 0,
		'aria-label': 'Alex Morgan',
	},
};

/** Supply an icon as fallback content, without generating initials. */
export const IconFallback: Story = {
	args: {
		src: undefined,
		delay: 0,
		'aria-label': 'Alex Morgan',
		fallback: (
			<Icon
				icon={ commentAuthorAvatar }
				style={ {
					inlineSize: '75%',
					blockSize: '75%',
					fill: 'currentColor',
				} }
			/>
		),
	},
	parameters: { controls: { exclude: [ 'fallback' ] } },
};

/** A mounted image that fails to load does not cover the fallback. */
export const FailedImage: Story = {
	args: { src: 'data:image/png;base64,invalid' },
	render: ( { src, fallback, delay, ...args } ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
			<Avatar.Image src={ src } alt="" keepMounted />
		</Avatar.Root>
	),
};

export const Sizes: Story = {
	render: ( { src, fallback, delay, ...args } ) => (
		<Stack gap="md" align="center">
			{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map( ( size ) => (
				<Avatar.Root { ...args } key={ size } size={ size }>
					<Avatar.Fallback delay={ delay }>
						{ fallback }
					</Avatar.Fallback>
					<Avatar.Image src={ src } alt="" />
				</Avatar.Root>
			) ) }
		</Stack>
	),
};

/** Hide a decorative avatar from assistive technology when the name is nearby. */
export const WithVisibleName: Story = {
	render: ( { src, fallback, delay, 'aria-label': label, ...args } ) => (
		<Stack gap="sm" align="center">
			<Avatar.Root { ...args } aria-hidden="true">
				<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
				<Avatar.Image src={ src } alt="" />
			</Avatar.Root>
			<Text>{ label }</Text>
		</Stack>
	),
};

/** Compose an interactive avatar with a named button and a tooltip. */
export const ProfileButton: Story = {
	render: ( { src, fallback, delay, 'aria-label': label, ...args } ) => (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Button
						variant="minimal"
						aria-label={ `View ${ label } profile` }
					>
						<Avatar.Root { ...args } aria-hidden="true">
							<Avatar.Fallback delay={ delay }>
								{ fallback }
							</Avatar.Fallback>
							<Avatar.Image src={ src } alt="" />
						</Avatar.Root>
					</Button>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	),
};

/** Keep the image mounted for lazy loading, with a short fallback grace period. */
export const LazyImage: Story = {
	render: ( { src, fallback, delay, ...args } ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
			<Avatar.Image src={ src } alt="" keepMounted loading="lazy" />
		</Avatar.Root>
	),
};

const ProfileImage = forwardRef<
	HTMLImageElement,
	React.ComponentProps< 'img' >
>( function UnforwardedProfileImage( props, ref ) {
	return <img alt="" { ...props } ref={ ref } />;
} );

/** Custom image components forward the ref and loading events to their image. */
export const CustomImage: Story = {
	render: ( { src, fallback, delay, ...args } ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
			<Avatar.Image
				keepMounted
				render={ <ProfileImage src={ src } alt="" /> }
			/>
		</Avatar.Root>
	),
};

/**
 * Image providers belong to the consumer. This example supplies a Gravatar
 * URL with a forced default image and a placeholder hash, without user data.
 */
export const Gravatar: Story = {
	args: {
		src: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y&s=96',
		fallback: 'AM',
		'aria-label': 'Alex Morgan',
	},
	render: ( { src, fallback, delay, ...args } ) => (
		<Avatar.Root { ...args }>
			<Avatar.Fallback delay={ delay }>{ fallback }</Avatar.Fallback>
			<Avatar.Image src={ src } alt="" keepMounted />
		</Avatar.Root>
	),
};
