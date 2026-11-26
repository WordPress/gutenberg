import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	chartBar,
	cog,
	color,
	comment,
	download,
	envelope,
	image,
	lock,
	moreVertical,
	payment,
	people,
	post,
	reset,
} from '@wordpress/icons';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as Card from '../../card';
import * as CollapsibleCard from '../../collapsible-card';
import { Icon } from '../../icon';
import { IconButton } from '../../icon-button';
import { Link } from '../../link';
import * as Menu from '../../menu';
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
		'aria-label': 'Settings',
		children: [
			<Item.LinkRow href="#users" key="users">
				<Item.Media>
					<Icon icon={ people } />
				</Item.Media>
				<Item.Label>Users</Item.Label>
				<Item.Description>
					Choose who can access your site, and what they can do.
				</Item.Description>
				<Item.Meta>
					<Badge intent="informational">4 users</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
			<Item.LinkRow href="#general" key="general">
				<Item.Media>
					<Icon icon={ cog } />
				</Item.Media>
				<Item.Label>General</Item.Label>
				<Item.Description>
					Site title, tagline, language, and time zone.
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
				<Card.Title render={ <h2 /> } id="notifications">
					Notifications
				</Card.Title>
				<Text variant="body-sm">
					Choose how you hear about activity on your site.
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
		'aria-labelledby': 'notifications',
		children: [
			<Item.LinkRow href="#email" key="email">
				<Item.Label>Email</Item.Label>
				<Item.Meta>
					<Badge intent="stable">On</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
			<Item.LinkRow href="#push" key="push">
				<Item.Label>Push notifications</Item.Label>
				<Item.Meta>
					<Badge>Off</Badge>
				</Item.Meta>
				<Item.Chevron />
			</Item.LinkRow>,
		],
	},
};

/**
 * A row can keep the controls that do not fit beside it in a menu. Here the
 * whole row opens the settings of the service, and the menu holds its other
 * actions. The menu trigger stays visible, and its name says which row it
 * acts on.
 */
export const WithOverflowMenu: Story = {
	args: {
		'aria-label': 'Connected services',
		children: [
			{
				key: 'payments',
				name: 'Payments',
				connected: true,
				description: 'Take card payments on your site.',
				icon: payment,
			},
			{
				key: 'analytics',
				name: 'Analytics',
				connected: false,
				description: 'See how visitors find and use your site.',
				icon: chartBar,
			},
			{
				key: 'email',
				name: 'Email delivery',
				connected: true,
				description: 'Send site emails through a dedicated service.',
				icon: envelope,
			},
		].map( ( service ) => (
			<Item.LinkRow href={ `#${ service.key }` } key={ service.key }>
				<Item.Media>
					<Icon icon={ service.icon } />
				</Item.Media>
				<Item.Label>{ service.name }</Item.Label>
				<Item.Description>{ service.description }</Item.Description>
				<Item.Meta>
					{ service.connected ? (
						<Badge intent="stable">Connected</Badge>
					) : (
						<Badge>Not connected</Badge>
					) }
				</Item.Meta>
				<Item.Actions>
					<Menu.Root>
						<Menu.Trigger
							render={
								<IconButton
									label={ `More actions for ${ service.name }` }
									icon={ moreVertical }
									variant="minimal"
									tone="neutral"
									size="compact"
								/>
							}
						/>
						<Menu.Popup>
							<Menu.LinkItem href={ `#${ service.key }-docs` }>
								<Menu.ItemLabel>
									View documentation
								</Menu.ItemLabel>
							</Menu.LinkItem>
							<Menu.Item>
								<Menu.ItemLabel>
									{ service.connected
										? 'Disconnect'
										: 'Connect' }
								</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				</Item.Actions>
			</Item.LinkRow>
		) ),
	},
};

/**
 * A card can hold more than one group, each under a heading of its own
 * that names it. The groups keep their own frames inside the padding of
 * the card, because the headings sit between them.
 */
export const InsideACollapsibleCard: Story = {
	render: () => (
		<CollapsibleCard.Root defaultOpen>
			<CollapsibleCard.Header role="heading" aria-level={ 2 }>
				<Card.Title>More settings</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="xl">
					<Stack direction="column" gap="sm">
						<Text
							variant="heading-sm"
							render={ <h3 /> }
							id="item-story-site"
						>
							Site
						</Text>
						<Item.Group aria-labelledby="item-story-site">
							<Item.LinkRow href="#privacy">
								<Item.Media>
									<Icon icon={ lock } />
								</Item.Media>
								<Item.Label>Privacy</Item.Label>
								<Item.Description>
									Choose who can see your site.
								</Item.Description>
								<Item.Chevron />
							</Item.LinkRow>
							<Item.LinkRow href="#discussion">
								<Item.Media>
									<Icon icon={ comment } />
								</Item.Media>
								<Item.Label>Discussion</Item.Label>
								<Item.Description>
									Comments, pingbacks and moderation.
								</Item.Description>
								<Item.Chevron />
							</Item.LinkRow>
						</Item.Group>
					</Stack>
					<Stack direction="column" gap="sm">
						<Text
							variant="heading-sm"
							render={ <h3 /> }
							id="item-story-content"
						>
							Content
						</Text>
						<Item.Group aria-labelledby="item-story-content">
							<Item.LinkRow href="#writing">
								<Item.Media>
									<Icon icon={ post } />
								</Item.Media>
								<Item.Label>Writing</Item.Label>
								<Item.Description>
									Default category and post format.
								</Item.Description>
								<Item.Chevron />
							</Item.LinkRow>
							<Item.LinkRow href="#media">
								<Item.Media>
									<Icon icon={ image } />
								</Item.Media>
								<Item.Label>Media</Item.Label>
								<Item.Description>
									Image sizes and upload folders.
								</Item.Description>
								<Item.Chevron />
							</Item.LinkRow>
						</Item.Group>
					</Stack>
					<Link href="#all-settings">All settings</Link>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	),
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
			<Item.Label>Export</Item.Label>
			<Item.Description>
				Download your posts, pages, and media.
			</Item.Description>
			<Item.Chevron />
		</Item.LinkRow>
	),
	args: {
		href: '#export',
	},
};
