import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	reset,
	chevronRight,
	download,
	globe,
	payment,
	tool,
	upload,
} from '@wordpress/icons';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as Card from '../../card';
import { Icon } from '../../icon';
import { Stack } from '../../stack';
import { Text } from '../../text';
import * as ItemGroup from '../index';

const meta: Meta< typeof ItemGroup.Root > = {
	title: 'Components/@wordpress-ui/ItemGroup',
	id: 'design-system-components-itemgroup',
	component: ItemGroup.Root,
	subcomponents: {
		'ItemGroup.Item': ItemGroup.Item,
	},
	parameters: {
		componentStatus: {
			status: 'unaudited',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ItemGroup.Root >;

/**
 * Items that lead to another screen. The whole row is the link, and the
 * chevron says that activating it opens something.
 */
export const Default: Story = {
	args: {
		'aria-label': 'Shipping',
		children: [
			<ItemGroup.Item
				key="zones"
				href="#zones"
				decoration={ <Icon icon={ globe } /> }
				title="Shipping zones"
				description="A geographic region where a set of shipping methods is offered."
				badges={
					<>
						<Badge intent="informational">4 zones</Badge>
						<Badge intent="high">1 incomplete</Badge>
					</>
				}
			/>,
			<ItemGroup.Item
				key="classes"
				href="#classes"
				decoration={ <Icon icon={ tool } /> }
				title="Classes"
				description="Group products that should ship under the same rules."
				badges={ <Badge intent="informational">2 classes</Badge> }
			/>,
			<ItemGroup.Item
				key="pickup"
				href="#pickup"
				decoration={ <Icon icon={ payment } /> }
				title="Local pickup"
				description="Let customers collect their order instead of having it shipped."
				badges={ <Badge intent="stable">Enabled</Badge> }
			/>,
		],
	},
};

/**
 * Items whose controls are their own. The row is static content, and each
 * control is described by the row, so "Export" is announced as
 * "Export, Export settings".
 */
export const WithActions: Story = {
	args: {
		'aria-label': 'Tools',
		children: [
			<ItemGroup.Item
				key="export"
				decoration={ <Icon icon={ download } /> }
				title="Export settings"
				description="Download your zones, methods and classes as a file."
				actions={ <Button variant="outline">Export</Button> }
			/>,
			<ItemGroup.Item
				key="import"
				decoration={ <Icon icon={ upload } /> }
				title="Import settings"
				description="Replace your configuration with a previously exported file."
				actions={ <Button variant="outline">Import</Button> }
			/>,
		],
	},
};

/**
 * An item can both be the control and hold a control of its own. The two are
 * siblings, never nested, so each is a separate activation target and the
 * markup stays valid.
 */
export const ActivatableWithAction: Story = {
	args: {
		'aria-label': 'Background',
		density: 'compact',
		children: [
			<ItemGroup.Item
				key="color"
				onClick={ () => {} }
				navigation="none"
				decoration={ <Icon icon={ payment } /> }
				title="Color"
				actions={
					<Button variant="minimal" tone="neutral" size="small">
						<Icon icon={ reset } size={ 20 } />
					</Button>
				}
			/>,
			<ItemGroup.Item
				key="gradient"
				onClick={ () => {} }
				navigation="none"
				decoration={ <Icon icon={ payment } /> }
				title="Gradient"
			/>,
		],
	},
};

/**
 * The compact density suits narrow contexts such as the block inspector.
 */
export const Compact: Story = {
	args: {
		'aria-label': 'Settings',
		density: 'compact',
		children: [
			<ItemGroup.Item key="a" href="#a" title="Dimensions" />,
			<ItemGroup.Item key="b" href="#b" title="Borders" />,
			<ItemGroup.Item key="c" href="#c" title="Elements" />,
		],
	},
};

/**
 * Each item on its own surface, for a list of a few substantial choices.
 */
export const Separated: Story = {
	args: {
		'aria-label': 'Connectors',
		variant: 'separated',
		children: [
			<ItemGroup.Item
				key="akismet"
				title="Akismet Anti-spam"
				description="Protect your site from spam."
				actions={ <Button variant="outline">Set up</Button> }
			/>,
			<ItemGroup.Item
				key="jetpack"
				title="Jetpack"
				description="Enhanced functionality with cloud services."
				actions={ <Button variant="outline">Connect</Button> }
			/>,
		],
	},
};

/**
 * Inside a surface that already draws a border and background, the group
 * contributes only its dividing lines.
 */
export const InsideACard: Story = {
	render: ( args ) => (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> } id="gateways">
					Payment gateways
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Card.FullBleed>
					<ItemGroup.Root { ...args } />
				</Card.FullBleed>
			</Card.Content>
		</Card.Root>
	),
	args: {
		'aria-labelledby': 'gateways',
		bordered: false,
		children: [
			<ItemGroup.Item
				key="card"
				href="#card"
				title="Card payments"
				badges={ <Badge intent="stable">Enabled</Badge> }
			/>,
			<ItemGroup.Item
				key="bank"
				href="#bank"
				title="Bank transfer"
				badges={ <Badge>Disabled</Badge> }
			/>,
		],
	},
};

/**
 * The glyph says what activating the item does, so an item that cannot be
 * activated never shows one, and `navigation="none"` suppresses it for an
 * item whose activation opens something in place.
 */
export const NavigationGlyphs: Story = {
	args: {
		'aria-label': 'Navigation',
		children: [
			<ItemGroup.Item
				key="drilldown"
				href="#drilldown"
				title="Opens a nested screen"
			/>,
			<ItemGroup.Item
				key="none"
				href="#none"
				title="No glyph"
				navigation="none"
			/>,
			<ItemGroup.Item key="static" title="Not activatable" />,
		],
	},
};

/**
 * Long titles wrap, and badges wrap onto their own line rather than
 * overflowing the row.
 */
export const LongContent: Story = {
	args: {
		'aria-label': 'Long content',
		children: [
			<ItemGroup.Item
				key="long"
				href="#long"
				decoration={ <Icon icon={ globe } /> }
				title="A title long enough that it has to wrap onto a second line on a narrow screen"
				description="A description that also runs on for long enough to wrap, so that the alignment of the decoration and the trailing glyph can be judged against more than one line."
				badges={
					<>
						<Badge>Value</Badge>
						<Badge intent="high">Value</Badge>
						<Badge intent="informational">Value</Badge>
						<Badge intent="stable">Value</Badge>
						<Badge intent="medium">Value</Badge>
						<Badge intent="low">Value</Badge>
						<Badge intent="draft">Value</Badge>
					</>
				}
			/>,
		],
	},
};

/**
 * The title takes any content, so a consumer can set its typography. The
 * font library names each family in its own typeface.
 */
export const CustomTitleContent: Story = {
	render: ( args ) => (
		<Stack direction="column" gap="lg">
			<Text render={ <h2 /> } variant="heading-sm" id="theme-fonts">
				Theme
			</Text>
			<ItemGroup.Root { ...args } aria-labelledby="theme-fonts" />
		</Stack>
	),
	args: {
		children: [
			<ItemGroup.Item
				key="noticia"
				href="#noticia"
				title={
					<span style={ { fontFamily: 'Georgia, serif' } }>
						Noticia Text
					</span>
				}
				badges={ <Text variant="body-sm">4 of 4 active</Text> }
			/>,
			<ItemGroup.Item
				key="rubik"
				href="#rubik"
				title={
					<span style={ { fontFamily: 'Verdana, sans-serif' } }>
						Rubik
					</span>
				}
				badges={ <Text variant="body-sm">2 of 2 active</Text> }
			/>,
		],
	},
};

/**
 * An item needs only a title. Decoration, description, badges and controls
 * are each optional.
 */
export const TitleOnly: Story = {
	args: {
		'aria-label': 'Billing',
		children: [
			<ItemGroup.Item key="a" href="#a" title="Active upgrades" />,
			<ItemGroup.Item key="b" href="#b" title="Billing history" />,
			<ItemGroup.Item key="c" href="#c" title="Payment methods" />,
		],
	},
};

/**
 * A list that mixes items which navigate with items that do not, to check
 * that a row without its own control shows no glyph.
 */
export const Mixed: Story = {
	args: {
		'aria-label': 'Mixed',
		children: [
			<ItemGroup.Item
				key="nav"
				href="#nav"
				decoration={ <Icon icon={ chevronRight } /> }
				title="Navigates"
				description="The whole row is the link."
			/>,
			<ItemGroup.Item
				key="static"
				decoration={ <Icon icon={ tool } /> }
				title="Does not navigate"
				description="Static content, with a control of its own."
				actions={ <Button variant="outline">Run</Button> }
			/>,
		],
	},
};
