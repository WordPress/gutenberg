/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import AvatarGroup from '..';
import Avatar from '../../avatar';

const meta: Meta< typeof AvatarGroup > = {
	component: AvatarGroup,
	title: 'Editor/Collaborators/AvatarGroup',
	id: 'editor-collaborators-avatar-group',
	tags: [ 'status-private' ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Internal component for real-time collaboration UI.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

const avatarUrl = ( seed: string ) =>
	`https://gravatar.com/avatar/${ seed }?s=96&d=identicon`;

export const Default: Story = {
	render: ( args ) => (
		<AvatarGroup { ...args }>
			<Avatar src={ avatarUrl( 'aaa' ) } name="Alice" />
			<Avatar src={ avatarUrl( 'bbb' ) } name="Bob" />
			<Avatar src={ avatarUrl( 'ccc' ) } name="Charlie" />
		</AvatarGroup>
	),
};

export const Overflow: Story = {
	args: {
		max: 3,
	},
	render: ( args ) => (
		<AvatarGroup { ...args }>
			<Avatar src={ avatarUrl( 'aaa' ) } name="Alice" />
			<Avatar src={ avatarUrl( 'bbb' ) } name="Bob" />
			<Avatar src={ avatarUrl( 'ccc' ) } name="Charlie" />
			<Avatar src={ avatarUrl( 'ddd' ) } name="Diana" />
			<Avatar src={ avatarUrl( 'eee' ) } name="Eve" />
			<Avatar src={ avatarUrl( 'fff' ) } name="Frank" />
		</AvatarGroup>
	),
};

export const WithBadges: Story = {
	render: ( args ) => (
		<AvatarGroup { ...args }>
			<Avatar
				src={ avatarUrl( 'aaa' ) }
				name="Alice"
				borderColor="#3858e9"
				variant="badge"
			/>
			<Avatar
				src={ avatarUrl( 'bbb' ) }
				name="Bob"
				borderColor="#e93858"
				variant="badge"
			/>
			<Avatar
				src={ avatarUrl( 'ccc' ) }
				name="Charlie"
				borderColor="#58e938"
				variant="badge"
			/>
		</AvatarGroup>
	),
	parameters: {
		docs: {
			description: {
				story: 'Avatars with `badge` variant expand on hover to reveal the name, pushing siblings aside.',
			},
		},
	},
};

export const MixedBadgeAndTooltip: Story = {
	render: ( args ) => (
		<AvatarGroup { ...args }>
			<Avatar
				src={ avatarUrl( 'aaa' ) }
				name="Alice"
				borderColor="#3858e9"
				variant="badge"
			/>
			<Avatar src={ avatarUrl( 'bbb' ) } name="Bob" />
			<Avatar
				src={ avatarUrl( 'ccc' ) }
				name="Charlie"
				borderColor="#58e938"
				variant="badge"
				label="You"
			/>
		</AvatarGroup>
	),
	parameters: {
		docs: {
			description: {
				story: 'Mixing badge avatars with tooltip-only avatars. The third avatar uses `label` to show "You" in the badge while preserving the full name in the tooltip.',
			},
		},
	},
};

export const CustomMax: Story = {
	args: {
		max: 2,
	},
	render: ( args ) => (
		<AvatarGroup { ...args }>
			<Avatar src={ avatarUrl( 'aaa' ) } name="Alice" />
			<Avatar src={ avatarUrl( 'bbb' ) } name="Bob" />
			<Avatar src={ avatarUrl( 'ccc' ) } name="Charlie" />
			<Avatar src={ avatarUrl( 'ddd' ) } name="Diana" />
		</AvatarGroup>
	),
};
