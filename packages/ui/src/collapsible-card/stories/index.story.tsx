import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Card from '../../card';
import * as CollapsibleCard from '../index';

/**
 * Temporary text component for story examples. This will be replaced by an
 * official DS `<Text />` component once it's available.
 */
function Text( { children }: { children: React.ReactNode } ) {
	return (
		<p
			style={ {
				margin: 0,
				fontFamily: [ 'var(--wp', 'ds-font-family-body)' ].join( '' ),
				fontSize: 'var(--wpds-font-size-md)',
				fontWeight: 'var(--wpds-font-weight-regular)',
				lineHeight: 'var(--wpds-font-line-height-sm)',
				textWrap: 'pretty',
				color: 'var(--wpds-color-fg-content-neutral-weak)',
			} }
		>
			{ children }
		</p>
	);
}

const meta: Meta< typeof CollapsibleCard.Root > = {
	title: 'Design System/Components/CollapsibleCard',
	component: CollapsibleCard.Root,
	subcomponents: {
		'CollapsibleCard.Header': CollapsibleCard.Header,
		'CollapsibleCard.Content': CollapsibleCard.Content,
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
