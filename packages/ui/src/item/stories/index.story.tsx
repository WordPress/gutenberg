import type { Meta, StoryObj } from '@storybook/react-vite';
import { download, globe, payment, reset, tool } from '@wordpress/icons';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as Card from '../../card';
import { Icon } from '../../icon';
import { IconButton } from '../../icon-button';
import { Stack } from '../../stack';
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
		'aria-label': 'Where you ship',
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
export const ThreeKindsOfRow: Story = {
	args: {
		'aria-label': 'Three kinds of row',
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
					<Button variant="outline">Edit</Button>
					<Button variant="minimal" tone="neutral">
						Remove
					</Button>
				</Item.Actions>
			</Item.ContentRow>,
		],
	},
};

/**
 * A row can both be the control and carry controls of its own. The row's
 * control covers the row rather than wrapping it, so nothing interactive is
 * nested and each keeps its own target.
 */
export const ActivatableWithActions: Story = {
	args: {
		'aria-label': 'Background',
		density: 'compact',
		children: [
			<Item.ButtonRow onClick={ () => {} } key="color">
				<Item.Media>
					<Icon icon={ payment } />
				</Item.Media>
				<Item.Label>Color</Item.Label>
				<Item.Actions>
					<IconButton
						label="Reset color"
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
 * Entries on separate surfaces are a group per entry, stacked. The group
 * has no variant for it: a frame around one row is a group of one.
 */
export const OnSeparateSurfaces: StoryObj< typeof Item.Group > = {
	render: () => (
		<Stack direction="column" gap="md">
			{ [
				[
					'Akismet Anti-spam',
					'Protect your site from spam.',
					'Set up',
				],
				[ 'Anthropic', 'Text generation with Claude.', 'Install' ],
			].map( ( [ label, description, action ] ) => (
				<Item.Group aria-label={ label } key={ label }>
					<Item.ContentRow>
						<Item.Label>{ label }</Item.Label>
						<Item.Description>{ description }</Item.Description>
						<Item.Actions>
							<Button variant="outline" size="compact">
								{ action }
							</Button>
						</Item.Actions>
					</Item.ContentRow>
				</Item.Group>
			) ) }
		</Stack>
	),
};

/**
 * Inside a `Card`, the card supplies the frame. The group draws a line
 * above itself when something precedes it there, and none when it is alone.
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
			<Item.Group { ...args } />
		</Card.Root>
	),
	args: {
		'aria-labelledby': 'gateways',
		frame: false,
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
 * A row works on its own, with no group around it. It renders its element
 * and nothing more, so it is not announced as a list of one.
 */
export const Standalone: StoryObj< typeof Item.LinkRow > = {
	render: () => (
		<Item.LinkRow href="#billing">
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
};
