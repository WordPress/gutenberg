import type { Meta, StoryObj } from '@storybook/react-vite';
import { color, download, globe, reset, tool } from '@wordpress/icons';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as Card from '../../card';
import { Icon } from '../../icon';
import { IconButton } from '../../icon-button';
import { Text } from '../../text';
import * as Item from '../index';

const meta: Meta< typeof Item.Group > = {
	title: 'Components/@wordpress-ui/Item',
	id: 'design-system-components-item',
	component: Item.Group,
	subcomponents: {
		'Item.LinkRow': Item.LinkRow,
		'Item.ButtonRow': Item.ButtonRow,
		'Item.ContentRow': Item.ContentRow,
		'Item.Media': Item.Media,
		'Item.Label': Item.Label,
		'Item.Description': Item.Description,
		'Item.Meta': Item.Meta,
		'Item.Chevron': Item.Chevron,
		'Item.Actions': Item.Actions,
	},
	parameters: {
		componentStatus: { status: 'unaudited', whereUsed: 'global' },
	},
};
export default meta;

type Story = StoryObj< typeof Item.Group >;

/**
 * Rows that take you somewhere. The whole row is the link, and the chevron
 * says so.
 */
export const Default: Story = {
	args: {
		'aria-label': 'Shipping',
		children: [
			<Item.LinkRow href="#zones" key="zones">
				<Item.Media>
					<Icon icon={ globe } />
				</Item.Media>
				<Item.Label>Shipping zones</Item.Label>
				<Item.Description>
					A geographic region where a set of shipping methods is
					offered.
				</Item.Description>
				<Item.Meta>
					<Badge intent="informational">4 zones</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
			<Item.LinkRow href="#settings" key="settings">
				<Item.Media>
					<Icon icon={ tool } />
				</Item.Media>
				<Item.Label>Shipping settings</Item.Label>
				<Item.Description>
					Calculations, shipping destination, and debug mode.
				</Item.Description>
				<Item.Chevron />
			</Item.LinkRow>,
		],
	},
};

/**
 * The three kinds of row: one that navigates, one that runs a command, and
 * one that is static content with controls of its own.
 */
export const RowTypes: Story = {
	args: {
		'aria-label': 'Row types',
		children: [
			<Item.LinkRow href="#styles" key="link">
				<Item.Label>Global Styles</Item.Label>
				<Item.Description>Open typography and colors.</Item.Description>
				<Item.Chevron />
			</Item.LinkRow>,
			<Item.ButtonRow onClick={ () => {} } key="button">
				<Item.Label>Export presets</Item.Label>
				<Item.Description>
					Download the current presets as JSON.
				</Item.Description>
			</Item.ButtonRow>,
			<Item.ContentRow key="content">
				<Item.Label>Soft shadow</Item.Label>
				<Item.Actions>
					<Button
						variant="outline"
						size="compact"
						aria-label="Edit soft shadow"
					>
						Edit
					</Button>
					<Button
						variant="minimal"
						tone="neutral"
						size="compact"
						aria-label="Remove soft shadow"
					>
						Remove
					</Button>
				</Item.Actions>
			</Item.ContentRow>,
		],
	},
};

/**
 * A link or button row can also carry controls of its own. The link or
 * button of the row covers the row and does not wrap it, so the controls in
 * `Item.Actions` are not nested inside it and each keeps its own target.
 *
 * Name each control for the row it acts on, and leave the chevron out.
 */
export const ButtonRowWithActions: Story = {
	args: {
		'aria-label': 'Background',
		density: 'compact',
		children: [
			<Item.ButtonRow onClick={ () => {} } key="color">
				<Item.Media>
					<Icon icon={ color } />
				</Item.Media>
				<Item.Label>Color</Item.Label>
				<Item.Meta>
					<Text variant="body-sm">#3858e9</Text>
				</Item.Meta>
				<Item.Actions>
					<IconButton
						label="Reset background color"
						icon={ reset }
						variant="minimal"
						tone="neutral"
						size="small"
					/>
				</Item.Actions>
			</Item.ButtonRow>,
		],
	},
};

/**
 * In a `detached` group each row has its own frame. It is still one list.
 * Use it when each row is a self-contained object, such as a connector
 * with its own status and actions.
 */
export const Detached: Story = {
	args: {
		'aria-label': 'Connectors',
		variant: 'detached',
		children: [
			<Item.ContentRow key="akismet">
				<Item.Label>Akismet Anti-spam</Item.Label>
				<Item.Description>
					Protect your site from spam.
				</Item.Description>
				<Item.Actions>
					<Button
						variant="outline"
						size="compact"
						aria-label="Set up Akismet Anti-spam"
					>
						Set up
					</Button>
				</Item.Actions>
			</Item.ContentRow>,
			<Item.ContentRow key="anthropic">
				<Item.Label>Anthropic</Item.Label>
				<Item.Description>
					Text generation with Claude.
				</Item.Description>
				<Item.Actions>
					<Button
						variant="outline"
						size="compact"
						aria-label="Install Anthropic"
					>
						Install
					</Button>
				</Item.Actions>
			</Item.ContentRow>,
		],
	},
};

/**
 * Inside a `Card`, place the group in a `Card.FullBleed` inside
 * `Card.Content`. The rows then run from edge to edge and the card is the
 * frame: the group keeps only a line above its first row, which separates
 * it from the card header.
 */
export const InsideACard: Story = {
	render: ( args ) => (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> } id="gateways">
					Payment gateways
				</Card.Title>
				<Text variant="body-sm">
					Connect the services that process payments.
				</Text>
			</Card.Header>
			<Card.Content>
				<Card.FullBleed>
					<Item.Group { ...args } />
				</Card.FullBleed>
			</Card.Content>
		</Card.Root>
	),
	args: {
		'aria-labelledby': 'gateways',
		children: [
			<Item.LinkRow href="#card" key="card">
				<Item.Label>Card payments</Item.Label>
				<Item.Meta>
					<Badge intent="stable">Enabled</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
			<Item.LinkRow href="#bank" key="bank">
				<Item.Label>Bank transfer</Item.Label>
				<Item.Meta>
					<Badge>Inactive</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
		],
	},
};

/**
 * A row works on its own, with no group around it, for something that is
 * always a single item. It draws its own frame and is not announced as a
 * list. For a list that can happen to hold one item, keep the `Item.Group`.
 */
export const Standalone: StoryObj< typeof Item.LinkRow > = {
	render: ( args ) => (
		<Item.LinkRow { ...args }>
			<Item.Media>
				<Icon icon={ download } />
			</Item.Media>
			<Item.Label>Billing history</Item.Label>
			<Item.Description>
				Invoices and receipts for this site.
			</Item.Description>
			<Item.Chevron />
		</Item.LinkRow>
	),
	args: {
		href: '#billing',
	},
};
