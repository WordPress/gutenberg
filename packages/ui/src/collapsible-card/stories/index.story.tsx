import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Card from '../../card';
import * as CollapsibleCard from '../index';
import { Stack } from '../../stack';

/**
 * Temporary text component for story examples. This will be replaced by an
 * official DS `<Text />` component once it's available.
 */
function Text( { children }: { children: React.ReactNode } ) {
	return (
		<p
			style={ {
				margin: 0,
				fontFamily: 'var(--wpds-typography-font-family-body)',
				fontSize: 'var(--wpds-typography-font-size-md)',
				fontWeight: 'var(--wpds-typography-font-weight-regular)',
				lineHeight: 'var(--wpds-typography-line-height-sm)',
				textWrap: 'pretty',
				color: 'var(--wpds-color-foreground-content-neutral-weak)',
			} }
		>
			{ children }
		</p>
	);
}

const meta: Meta< typeof CollapsibleCard.Root > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/CollapsibleCard',
	component: CollapsibleCard.Root,
	subcomponents: {
		'CollapsibleCard.Header': CollapsibleCard.Header,
		'CollapsibleCard.HeaderDescription': CollapsibleCard.HeaderDescription,
		'CollapsibleCard.Content': CollapsibleCard.Content,
		'Card.FullBleed': Card.FullBleed,
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof CollapsibleCard.Root >;

/**
 * A collapsible card that is open by default.
 */
export const Default: Story = {
	args: {
		children: (
			<>
				<CollapsibleCard.Header>
					<Card.Title>
						Collapsible card (closed by default)
					</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>
						This is the collapsible content area. It can contain any
						elements, just like a regular Card.Content.
					</Text>
					<Text>
						When collapsed, only the header and chevron are visible.
					</Text>
				</CollapsibleCard.Content>
			</>
		),
	},
};

/**
 * A collapsible card that starts collapsed.
 */
export const InitiallyOpened: Story = {
	// `defaultOpen` (uncontrolled) and `open` (controlled) should not be
	// used together — disable the `open` control to avoid confusion.
	argTypes: { open: { control: false } },
	args: {
		...Default.args,
		defaultOpen: true,
		children: (
			<>
				<CollapsibleCard.Header>
					<Card.Title>Collapsed by default</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>This content was hidden until you expanded it.</Text>
				</CollapsibleCard.Content>
			</>
		),
	},
};

/**
 * A disabled collapsible card cannot be toggled by the user.
 */
export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
		children: (
			<>
				<CollapsibleCard.Header>
					<Card.Title>Disabled card</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>The header is not interactive when disabled.</Text>
				</CollapsibleCard.Content>
			</>
		),
	},
};

/**
 * Multiple collapsible cards stacked vertically, simulating a typical
 * settings-panel or FAQ-style layout.
 */
export const Stacked: Story = {
	parameters: { controls: { disable: true } },
	render: () => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--wpds-dimension-gap-lg)',
			} }
		>
			{ [
				'General',
				'Advanced',
				'Accessibility',
				'Performance',
				'Privacy',
				'Notifications',
			].map( ( title ) => (
				<CollapsibleCard.Root key={ title }>
					<CollapsibleCard.Header>
						<Card.Title>{ title }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Text>
							Configure all { title.toLowerCase() } settings for
							your site. Changes here affect how your site behaves
							across all pages and posts.
						</Text>
						<Text>
							Review each option carefully before saving. Some
							changes may require a page reload to take effect.
							Hover over individual options for more details about
							what they control.
						</Text>
						<Text>
							If you&apos;re unsure about a setting, you can
							always reset to defaults using the button at the
							bottom of this section. Your previous configuration
							will be saved as a backup.
						</Text>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) ) }
		</div>
	),
};

/**
 * `CollapsibleCard.Header` renders a `<div>` wrapper by default. Pass an
 * `<h1>`–`<h6>` React element to the `render` prop to wrap the trigger in
 * a heading and contribute to the document outline. The right level
 * depends on the surrounding outline, so the consumer is expected to opt
 * in.
 */
export const WithHeadingElement: Story = {
	parameters: { controls: { disable: true } },
	render: () => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--wpds-dimension-gap-lg)',
			} }
		>
			<CollapsibleCard.Root>
				<CollapsibleCard.Header render={ <h2 /> }>
					<Card.Title>Heading level 2</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>
						The wrapper renders as an h2 element when the consumer
						passes an h2 React element to the render prop.
					</Text>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
			<CollapsibleCard.Root>
				<CollapsibleCard.Header render={ <h3 /> }>
					<Card.Title>Heading level 3</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>
						Pass any of h1–h6 to choose the level that fits the
						surrounding document outline.
					</Text>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
			<CollapsibleCard.Root>
				<CollapsibleCard.Header>
					<Card.Title>No heading (default)</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>
						Without a render prop, the header wraps the trigger in a
						plain div and does not contribute to the document
						outline.
					</Text>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</div>
	),
};

/**
 * A collapsible card with a `HeaderDescription` that provides supplementary
 * information (e.g. status, summary) as an `aria-describedby` relationship.
 */
export const WithHeaderDescription: Story = {
	// `defaultOpen` (uncontrolled) and `open` (controlled) should not be
	// used together — disable the `open` control to avoid confusion.
	argTypes: { open: { control: false } },
	args: {
		defaultOpen: true,
	},
	render: ( { open, defaultOpen, onOpenChange, disabled, ...restArgs } ) => (
		<CollapsibleCard.Root
			open={ open }
			defaultOpen={ defaultOpen }
			onOpenChange={ onOpenChange }
			disabled={ disabled }
			{ ...restArgs }
		>
			<CollapsibleCard.Header>
				<Stack justify="space-between">
					<Card.Title>Settings</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<span
							style={ {
								fontSize: 'var(--wpds-typography-font-size-sm)',
								color: 'var(--wpds-color-foreground-content-neutral-weak)',
							} }
						>
							3 items configured
						</span>
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Text>
					The header description provides supplementary context to the
					trigger button. Assistive technologies will announce the
					description alongside the button label.
				</Text>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	),
};

/**
 * Visual comparison: a `CollapsibleCard` (open) next to a regular `Card`
 * to verify identical spacing and layout.
 */
export const ComparedToCard: Story = {
	// `defaultOpen` (uncontrolled) and `open` (controlled) should not be
	// used together — disable the `open` control to avoid confusion.
	argTypes: { open: { control: false } },
	args: {
		...Default.args,
		defaultOpen: true,
	},
	render: ( { open, defaultOpen, onOpenChange, disabled, ...restArgs } ) => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: 'var( --wpds-dimension-gap-lg )',
			} }
		>
			<CollapsibleCard.Root
				open={ open }
				defaultOpen={ defaultOpen }
				onOpenChange={ onOpenChange }
				disabled={ disabled }
				{ ...restArgs }
			>
				<CollapsibleCard.Header>
					<Card.Title>CollapsibleCard (open)</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Text>
						Content should align with the regular card below.
					</Text>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
			<Card.Root { ...restArgs }>
				<Card.Header>
					<Card.Title>Regular Card</Card.Title>
				</Card.Header>
				<Card.Content>
					<Text>
						Content should align with the collapsible card above.
					</Text>
				</Card.Content>
			</Card.Root>
		</div>
	),
};

/**
 * When `Card.FullBleed` is the sole child of `CollapsibleCard.Content` and a
 * header sits above it, the media bumps against the card&apos;s side and
 * bottom edges while the header retains its normal padding. (Unlike a plain
 * `Card`, a header is always required here for the collapse trigger — see
 * `Card` stories for a body-only `FullBleedCoverOnly` example.)
 */
export const FullBleedCoverWithHeader: Story = {
	argTypes: { open: { control: false } },
	args: {
		defaultOpen: true,
		children: (
			<>
				<CollapsibleCard.Header>
					<Card.Title>Card title</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Card.FullBleed>
						<div
							style={ {
								height: 180,
								background:
									'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
							} }
						/>
					</Card.FullBleed>
				</CollapsibleCard.Content>
			</>
		),
	},
};

/**
 * `Card.FullBleed` breaks out of the content padding to span edge-to-edge.
 * Useful for images, dividers, or embedded content inside the collapsible
 * region.
 */
export const WithFullBleed: Story = {
	argTypes: { open: { control: false } },
	args: {
		defaultOpen: true,
		children: (
			<>
				<CollapsibleCard.Header>
					<Card.Title>Featured image</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content
					render={ <Stack direction="column" gap="lg" /> }
				>
					<Card.FullBleed>
						<div
							style={ {
								height: 160,
								background:
									'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							} }
						/>
					</Card.FullBleed>
					<Text>Content below the full-bleed area.</Text>
				</CollapsibleCard.Content>
			</>
		),
	},
};
