import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../index';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';
import * as Tooltip from '../../tooltip';

// Served from `storybook/static`.
const IMAGE_SRC = 'profile-picture.svg';

const meta: Meta< typeof Avatar > = {
	title: 'Components/@wordpress-ui/Avatar',
	id: 'design-system-components-avatar',
	component: Avatar,
	args: { name: 'Alex Morgan' },
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Avatar >;

export const Default: Story = {
	args: { src: IMAGE_SRC },
};

/** The assigned color sets the activity ring; the initials fill adapts to contrast with it. */
export const WithColor: Story = {
	args: { color: '#008a20' },
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } src={ IMAGE_SRC } active />
			<Avatar { ...args } active />
			<Avatar { ...args } />
		</Stack>
	),
};

/** Activity changes the ring without changing the avatar's footprint. */
export const Activity: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } active={ false } />
			<Avatar { ...args } active />
			<Avatar { ...args } src={ IMAGE_SRC } active={ false } />
			<Avatar { ...args } src={ IMAGE_SRC } active />
		</Stack>
	),
};

/** Single-word names display one larger initial. Hyphens and apostrophes stay within words. */
export const Initials: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			{ [
				'Alex Morgan',
				'Alex',
				'Jean-Luc',
				"O'Connor",
				'👩🏽‍💻',
				'李 小龙',
			].map( ( name ) => (
				<Avatar { ...args } key={ name } name={ name } />
			) ) }
		</Stack>
	),
};

/** Size describes the intended image size on high-DPI screens, with ring space reserved outside it. */
export const Sizes: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map( ( size ) => (
				<Avatar { ...args } key={ size } size={ size } />
			) ) }
		</Stack>
	),
};

/** Use a circle for a person's portrait and a square to preserve the corners of a site logo. */
export const Shapes: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } src={ IMAGE_SRC } shape="circle" />
			<Avatar
				{ ...args }
				name="WordPress"
				src="wordpress-wmark.svg"
				shape="square"
			/>
		</Stack>
	),
};

/** Render the Avatar as the button so the focus ring follows its shape. */
export const Interactive: Story = {
	args: { color: '#008a20', active: true },
	render: ( args ) => (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Avatar
						{ ...args }
						render={ <Button variant="unstyled" /> }
					/>
				}
			/>
			<Tooltip.Popup>{ args.name }</Tooltip.Popup>
		</Tooltip.Root>
	),
};

/** Hide the avatar from assistive technology when nearby text identifies the person. */
export const WithVisibleName: Story = {
	render: ( args ) => (
		<Stack gap="sm" align="center">
			<Avatar { ...args } aria-hidden="true" />
			<Text>{ args.name }</Text>
		</Stack>
	),
};
