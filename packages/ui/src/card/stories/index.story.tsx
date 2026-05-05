import type { Meta, StoryObj } from '@storybook/react-vite';
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
				color: 'var(--wpds-color-fg-content-neutral-weak)',
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
				<Card.Content>
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
 * An image placed directly inside `Card.Root` (before `Card.Header` and
 * `Card.Content`) naturally touches all four card edges. The card's
 * `overflow: clip` and `border-radius` clip it to the rounded corners, and
 * the header and content below retain their normal padding.
 */
export const HeroImageWithHeaderAndContent: Story = {
	args: {
		children: (
			<>
				<div
					style={ {
						height: 180,
						background:
							'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					} }
				/>
				<Card.Header>
					<Card.Title>Hero image card</Card.Title>
				</Card.Header>
				<Card.Content>
					<Text>Card body text below the hero image and title.</Text>
				</Card.Content>
			</>
		),
	},
};

/**
 * Hero image followed only by a `Card.Header`. No content section below.
 */
export const HeroImageWithHeader: Story = {
	args: {
		children: (
			<>
				<div
					style={ {
						height: 180,
						background:
							'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					} }
				/>
				<Card.Header>
					<Card.Title>Hero image card</Card.Title>
				</Card.Header>
			</>
		),
	},
};

/**
 * Hero image followed only by a `Card.Content` body. No header section.
 */
export const HeroImageWithContent: Story = {
	args: {
		children: (
			<>
				<div
					style={ {
						height: 180,
						background:
							'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					} }
				/>
				<Card.Content>
					<Text>Card body text below the hero image.</Text>
				</Card.Content>
			</>
		),
	},
};

/**
 * A single image filling the entire card — no header or content sections.
 * The image is placed directly inside `Card.Root` and is clipped to the
 * card's rounded corners by `overflow: clip`.
 */
export const CoverImage: Story = {
	args: {
		children: (
			<div
				style={ {
					height: 180,
					background:
						'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
				} }
			/>
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
