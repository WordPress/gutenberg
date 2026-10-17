import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef } from '@wordpress/element';
import * as Avatar from '../index';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';
import styles from './colors.module.css';

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
	argTypes: {
		color: { control: 'color' },
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

function ColorSamples( props: React.ComponentProps< typeof Avatar.Root > ) {
	return (
		<Stack gap="sm" align="center">
			<Avatar.Root { ...props } aria-hidden="true">
				<Avatar.Fallback />
				<Avatar.Image src={ IMAGE_SRC } alt="" />
			</Avatar.Root>
			<Avatar.Root { ...props } aria-hidden="true">
				<Avatar.Initials name="Alex Morgan" />
			</Avatar.Root>
			<Avatar.Root { ...props } aria-hidden="true">
				<Avatar.Fallback />
			</Avatar.Root>
		</Stack>
	);
}

/** Compare image rings and colored fallbacks with shared size and shape controls. */
export const WithColor: Story = {
	args: { color: '#008a20', shape: 'circle' },
	parameters: { controls: { include: [ 'color', 'size', 'shape' ] } },
	render: ( args ) => {
		const colors = [
			...new Set( [
				args.color ?? '#008a20',
				'#d94145',
				'#fbbf24',
				'#f3d1ab',
				'#00cfff',
				'#3858e9',
				'#6f42c1',
				'#757575',
				'#000000',
				'#ffffff',
			] ),
		];
		return (
			<div
				className={ styles.gallery }
				role="region"
				aria-label="Colored Avatar examples"
				tabIndex={ 0 }
			>
				<p>
					Each color shows an image, initials, and the person icon.
					Use Size and Shape in Controls to update every sample.
					Change Color to update the first sample.
				</p>
				<p>
					Initials target at least 4.5:1 contrast and the person icon
					3:1 against the fill. Colored fallbacks have no border;
					loaded images keep the supplied color ring. Forced-colors
					mode retains a visible border. See Unsupported Colors for
					input limitations and best-effort development warnings.
				</p>
				<table>
					<thead>
						<tr>
							<th scope="col">Color</th>
							<th scope="col">Image / initials / person icon</th>
						</tr>
					</thead>
					<tbody>
						{ colors.map( ( color, index ) => (
							<tr key={ color }>
								<th scope="row">
									{ index === 0 && (
										<>
											Custom
											<br />
										</>
									) }
									<code>{ color }</code>
								</th>
								<td>
									<ColorSamples { ...args } color={ color } />
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	},
};

/** Keyboard focus stays outside the avatar, even when the fill matches the focus color. */
export const Interactive: Story = {
	args: { color: '#008a20' },
	render: ( args ) => (
		<Stack gap="lg" align="center">
			{ [
				{
					name: 'Alex Morgan',
					label: 'Custom color',
					color: args.color,
				},
				{
					name: 'Sam Rivera',
					label: 'Fill matches focus color',
					color: 'var(--wpds-color-stroke-focus)',
				},
			].map( ( { name, label, color } ) => (
				<Stack key={ name } direction="column" gap="sm" align="center">
					<Button
						variant="unstyled"
						aria-label={ `Open ${ name }'s profile` }
						style={ {
							display: 'inline-flex',
							borderRadius:
								args.shape === 'square'
									? 'var(--wpds-border-radius-sm)'
									: '50%',
						} }
					>
						<Avatar.Root
							{ ...args }
							color={ color }
							aria-hidden="true"
						>
							<Avatar.Initials name={ name } />
						</Avatar.Root>
					</Button>
					<Text>{ label }</Text>
				</Stack>
			) ) }
		</Stack>
	),
};

function FallbackSamples( props: React.ComponentProps< typeof Avatar.Root > ) {
	return (
		<Stack gap="lg" align="center">
			{ ( [ 'circle', 'square' ] as const ).map( ( shape ) => (
				<Stack key={ shape } gap="sm" align="center">
					<Avatar.Root
						{ ...props }
						shape={ shape }
						aria-hidden="true"
					>
						<Avatar.Initials name="Alex Morgan" />
					</Avatar.Root>
					<Avatar.Root
						{ ...props }
						shape={ shape }
						aria-hidden="true"
					>
						<Avatar.Fallback />
					</Avatar.Root>
				</Stack>
			) ) }
		</Stack>
	);
}

/** Demonstrate unsupported fills and the limits of development warnings. */
export const UnsupportedColors: Story = {
	args: { size: 'lg' },
	parameters: {
		controls: { include: [ 'size' ] },
		// This demonstration intentionally reproduces insufficient contrast.
		// Keep the accessibility findings visible without failing other stories.
		a11y: { test: 'todo' },
	},
	render: ( args ) => {
		const examples = [
			[
				'currentColor',
				'Keyword scan detects the foreground dependency.',
			],
			[
				'color-mix(in srgb, currentColor 50%, red)',
				'Keyword scan detects the foreground dependency.',
			],
			[
				'var(--_wp-ui-avatar-unsupported-color)',
				'The variable resolves to currentColor. Not detected.',
			],
			[
				String.raw`\63 urrentColor`,
				'Escaped currentColor. Not detected.',
			],
			[
				'var(--_wp-ui-avatar-missing-color)',
				'The variable is undefined. Not detected.',
			],
			[ 'not-a-color', 'CSS.supports() rejects the color.' ],
			[ 'inherit', 'CSS.supports() rejects the relative-color fill.' ],
		];
		return (
			<div
				className={ `${ styles.gallery } ${ styles.unsupported }` }
				role="region"
				aria-label="Unsupported Avatar colors"
				tabIndex={ 0 }
			>
				<p>
					These examples intentionally use unsupported colors in both
					shapes. A fill that depends on its foreground can lose
					contrast. Invalid colors and missing variables can remove
					the fill.
				</p>
				<p>
					In supporting browsers, development builds warn about
					explicit <code>currentColor</code> tokens and values
					rejected by <code>CSS.supports()</code>. Warnings are
					best-effort and deduplicated. They do not resolve CSS
					variables or detect every unsupported expression, including
					escaped keywords. The absence of a warning does not
					guarantee sufficient contrast.
				</p>
				<table>
					<thead>
						<tr>
							<th scope="col">Color</th>
							<th scope="col">Fallbacks</th>
							<th scope="col">Best-effort validation</th>
						</tr>
					</thead>
					<tbody>
						{ examples.map( ( [ color, explanation ] ) => (
							<tr key={ color }>
								<th scope="row">
									<code>{ color }</code>
								</th>
								<td>
									<FallbackSamples
										{ ...args }
										color={ color }
									/>
								</td>
								<td>{ explanation }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	},
};

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
	args: { size: 'sm' },
	render: ( args ) => (
		<Stack direction="column" gap="md">
			<Stack gap="sm" align="center">
				<Avatar.Root { ...args } aria-hidden="true">
					<Avatar.Fallback delay={ 300 }>AM</Avatar.Fallback>
					<Avatar.Image src={ IMAGE_SRC } alt="" />
				</Avatar.Root>
				<Text>Alex Morgan</Text>
			</Stack>
			<Stack gap="sm" align="center">
				<Avatar.Root { ...args } aria-hidden="true">
					<Avatar.Fallback>AM</Avatar.Fallback>
				</Avatar.Root>
				<Text>Alex Morgan</Text>
			</Stack>
			<Stack gap="sm" align="center">
				<Avatar.Root { ...args } aria-hidden="true">
					<Avatar.Fallback />
				</Avatar.Root>
				<Text>Alex Morgan</Text>
			</Stack>
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
