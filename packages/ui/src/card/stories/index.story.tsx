import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '@wordpress/ui';
import * as Card from '../index';

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

const meta: Meta< typeof Card.Root > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Card',
	component: Card.Root,
	subcomponents: {
		'Card.Header': Card.Header,
		'Card.Content': Card.Content,
		'Card.FullBleed': Card.FullBleed,
		'Card.Title': Card.Title,
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Card.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Card.Header>
					<Card.Title>Card title</Card.Title>
				</Card.Header>
				<Card.Content>
					<Text>
						This is the main content area. It can contain any
						elements. This is the main content area. It can contain
						any elements. This is the main content area. It can
						contain any elements. This is the main content area. It
						can contain any elements. This is the main content area.
						It can contain any elements. This is the main content
						area. It can contain any elements.
					</Text>
					<Text>
						This is the main content area. It can contain any
						elements.
					</Text>
				</Card.Content>
			</>
		),
	},
};

/**
 * `Card.FullBleed` as the sole child of `Card.Content` spans edge-to-edge
 * with no padding around it.
 */
export const FullBleedCoverOnly: Story = {
	args: {
		children: (
			<Card.Content>
				<Card.FullBleed>
					<div
						style={ {
							height: 180,
							background:
								'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
						} }
					/>
				</Card.FullBleed>
			</Card.Content>
		),
	},
};

/**
 * When `Card.FullBleed` is the sole child of `Card.Content` and a
 * `Card.Header` sits above it, the image bumps against the card's side and
 * bottom edges while the header retains its normal padding.
 */
export const FullBleedCoverWithHeader: Story = {
	args: {
		children: (
			<>
				<Card.Header>
					<Card.Title>Card title</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.FullBleed>
						<div
							style={ {
								height: 180,
								background:
									'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
							} }
						/>
					</Card.FullBleed>
				</Card.Content>
			</>
		),
	},
};

/**
 * `Card.FullBleed` breaks out of the card's padding to span
 * edge-to-edge. Useful for images, dividers, or embedded content.
 */
export const WithFullBleed: Story = {
	args: {
		children: (
			<>
				<Card.Header>
					<Card.Title>Featured image</Card.Title>
				</Card.Header>
				<Card.Content render={ <Stack direction="column" gap="lg" /> }>
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
				</Card.Content>
			</>
		),
	},
};

/**
 * A minimal card with only a header.
 */
export const HeaderOnly: Story = {
	args: {
		children: (
			<Card.Header>
				<Card.Title>Simple card</Card.Title>
			</Card.Header>
		),
	},
};

/**
 * When `Card.FullBleed` is the **first child** of `Card.Header`, it extends
 * flush to the card's top and side edges — ideal for hero images. Content
 * that follows inside the header is padded normally.
 */
export const FullBleedHeroWithTitle: Story = {
	args: {
		children: (
			<>
				<Card.Header render={ <Stack direction="column" gap="lg" /> }>
					<Card.FullBleed>
						<div
							style={ {
								height: 180,
								background:
									'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
							} }
						/>
					</Card.FullBleed>
					<Card.Title>Hero image card</Card.Title>
				</Card.Header>
				<Card.Content>
					<Text>
						The image above bleeds to the card&apos;s top and side
						edges.
					</Text>
				</Card.Content>
			</>
		),
	},
};

/**
 * When `Card.FullBleed` is the **only child** of `Card.Header`, it fills the
 * header entirely — top and sides flush to the card edges, no extra padding
 * below.
 */
export const FullBleedHeroOnly: Story = {
	args: {
		children: (
			<>
				<Card.Header>
					<Card.FullBleed>
						<div
							style={ {
								height: 180,
								background:
									'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
							} }
						/>
					</Card.FullBleed>
				</Card.Header>
				<Card.Content>
					<Text>
						The image above bleeds to the card&apos;s top and side
						edges.
					</Text>
				</Card.Content>
			</>
		),
	},
};

/**
 * Use the `render` prop to change the underlying HTML elements for
 * better semantics. Here, `Card.Root` renders as a `<section>` and
 * `Card.Title` renders as an `<h2>`.
 */
export const CustomSemantics: Story = {
	args: {
		render: <section />,
		children: (
			<>
				<Card.Header>
					<Card.Title render={ <h2 /> }>Section heading</Card.Title>
				</Card.Header>
				<Card.Content>
					<Text>Semantically meaningful card content.</Text>
				</Card.Content>
			</>
		),
	},
};
