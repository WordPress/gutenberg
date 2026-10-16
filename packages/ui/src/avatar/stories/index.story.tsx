import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef } from '@wordpress/element';
import * as Avatar from '../index';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';
import explorationStyles from './fallback-colors.module.css';

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

/** The color ring preserves loaded images and colors their fallback content. */
export const WithColor: Story = {
	args: { color: '#008a20' },
	render: ( args ) => (
		<Stack gap="lg" align="center">
			<Avatar.Root { ...args }>
				<Avatar.Fallback />
				<Avatar.Image src={ IMAGE_SRC } alt="" />
			</Avatar.Root>
			<Avatar.Root { ...args }>
				<Avatar.Initials name="Alex Morgan" />
			</Avatar.Root>
			<Avatar.Root { ...args }>
				<Avatar.Fallback />
			</Avatar.Root>
		</Stack>
	),
};

/** Keyboard focus stays outside the avatar, even when both rings have the same color. */
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
					label: 'Matches focus color',
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

/** Compare neutral, black/white, capped tint, and uncapped tint fallbacks. */
export const FallbackColors: Story = {
	args: { color: '#008a20', size: 'lg' },
	render: ( args ) => {
		const colors = [
			[ 'Custom color', args.color ?? '#008a20' ],
			[ 'Bright green', '#00e050' ],
			[ 'Dark green', '#064e3b' ],
			[ 'Gray below crossover', '#757575' ],
			[ 'Gray above crossover', '#767676' ],
			[ 'Midtone gray', '#777777' ],
			[ 'Yellow', '#fbbf24' ],
			[ 'Cyan', '#00cfff' ],
			[ 'Theme color', 'var(--wpds-color-stroke-surface-brand)' ],
		];
		const approaches = [
			[ 'Neutral', 'neutral' ],
			[ 'Native black/white', 'native' ],
			[ 'WCAG black/white', 'wcag' ],
			[ 'Tint capped at 20%', 'tinted' ],
			[ 'Uncapped tint', 'uncapped' ],
		];
		return (
			<div className={ explorationStyles.gallery }>
				<p>
					Change the custom color, size, and shape in Controls. Filled
					fallbacks use opaque sRGB colors. Both tinted columns fall
					back to native black/white, then neutral, as feature support
					allows.
				</p>
				<p>
					Both tints target 4.55:1 contrast. The capped tint blends at
					most 20% of the background into black or white. The uncapped
					tint uses the full blend that retains the target contrast.
				</p>
				<p>
					Colored fallbacks do not support <code>currentColor</code>,
					including through CSS variables or color functions. Their
					fill must resolve independently of the foreground.
					Transparent colors become opaque, and out-of-gamut channels
					are clipped to sRGB.
				</p>
				<p>
					Development warnings are best-effort. They do not resolve
					CSS variables or detect every unsupported expression. The
					absence of a warning does not guarantee sufficient contrast.
					See Unsupported Colors for examples.
				</p>
				<table>
					<thead>
						<tr>
							<th scope="col">Color</th>
							{ approaches.map( ( [ label ] ) => (
								<th key={ label } scope="col">
									{ label }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ colors.map( ( [ label, color ] ) => (
							<tr key={ label }>
								<th scope="row">{ label }</th>
								{ approaches.map( ( [ approach, variant ] ) => (
									<td key={ approach }>
										<Stack gap="lg" align="center">
											<Avatar.Root
												{ ...args }
												color={ color }
												aria-hidden="true"
												style={
													{
														'--_wp-ui-avatar-exploration-color':
															color,
													} as React.CSSProperties
												}
											>
												<Avatar.Initials
													name="Alex Morgan"
													className={
														explorationStyles[
															variant
														]
													}
												/>
											</Avatar.Root>
											<Avatar.Root
												{ ...args }
												color={ color }
												aria-hidden="true"
												style={
													{
														'--_wp-ui-avatar-exploration-color':
															color,
													} as React.CSSProperties
												}
											>
												<Avatar.Fallback
													className={
														explorationStyles[
															variant
														]
													}
												/>
											</Avatar.Root>
										</Stack>
									</td>
								) ) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	},
};

/** Demonstrate unsupported fills and the limits of development warnings. */
export const UnsupportedColors: Story = {
	args: { size: 'lg' },
	parameters: {
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
				className={ `${ explorationStyles.gallery } ${ explorationStyles.unsupported }` }
				role="region"
				aria-label="Unsupported Avatar colors"
				tabIndex={ 0 }
			>
				<p>
					These examples intentionally use unsupported colors. A fill
					that depends on its foreground can lose contrast. Invalid
					colors and missing variables can remove the fill.
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
									<Stack gap="lg" align="center">
										<Avatar.Root
											{ ...args }
											color={ color }
											aria-hidden="true"
										>
											<Avatar.Initials name="Alex Morgan" />
										</Avatar.Root>
										<Avatar.Root
											{ ...args }
											color={ color }
											aria-hidden="true"
										>
											<Avatar.Fallback />
										</Avatar.Root>
									</Stack>
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
