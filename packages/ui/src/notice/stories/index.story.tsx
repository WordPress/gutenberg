import type { Meta, StoryObj } from '@storybook/react-vite';
import { unseen } from '@wordpress/icons';
import * as Notice from '../index';

const meta: Meta< typeof Notice.Root > = {
	title: 'Components/@wordpress-ui/Notice',
	id: 'design-system-components-notice',
	component: Notice.Root,
	tags: [ 'manifest' ],
	subcomponents: {
		'Notice.Title': Notice.Title,
		'Notice.Description': Notice.Description,
		'Notice.Actions': Notice.Actions,
		'Notice.CloseIconButton': Notice.CloseIconButton,
		'Notice.ActionButton': Notice.ActionButton,
		'Notice.ActionLink': Notice.ActionLink,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Notice does not announce its content automatically. See [Notice announcements](?path=/docs/design-system-components-notice-announcements--docs) for announcement examples and migration from `spokenMessage` and `politeness`.',
			},
		},
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Notice.Root >;

export const Default: Story = {
	args: {
		children: [
			<Notice.Title key="title">Notice Title</Notice.Title>,
			<Notice.Description key="description">
				Description text with details about this notification.
			</Notice.Description>,
			<Notice.Actions key="actions">
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>,
			<Notice.CloseIconButton key="closeIconButton" />,
		],
	},
};

export const Info: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'info',
	},
};

export const Warning: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'warning',
	},
};

export const Success: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'success',
	},
};

export const Error: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'error',
	},
};

/**
 * Omit Notice.CloseIconButton to make the notice non-dismissable.
 */
export const NonDismissible: Story = {
	args: {
		intent: 'warning',
		children: [
			<Notice.Title key="title">Action Required</Notice.Title>,
			<Notice.Description key="description">
				This notice cannot be dismissed by the user.
			</Notice.Description>,
			<Notice.Actions key="actions">
				<Notice.ActionButton>Take Action</Notice.ActionButton>
				<Notice.ActionLink href="#">Visit link</Notice.ActionLink>
			</Notice.Actions>,
		],
	},
};

/**
 * Pass `icon={ null }` to hide the default decorative icon.
 */
export const WithoutIcon: Story = {
	args: {
		intent: 'info',
		icon: null,
		children: [
			<Notice.Title key="title">No Icon</Notice.Title>,
			<Notice.Description key="description">
				This notice has no decorative icon displayed.
			</Notice.Description>,
			<Notice.CloseIconButton key="closeIconButton" />,
		],
	},
};

export const WithoutActions: Story = {
	args: {
		intent: 'info',
		children: [
			<Notice.Title key="title">Simple Notice</Notice.Title>,
			<Notice.Description key="description">
				A dismissable notice without any action buttons or links.
			</Notice.Description>,
			<Notice.CloseIconButton key="closeIconButton" />,
		],
	},
};

/**
 * Title only, no description or actions.
 */
export const TitleOnly: Story = {
	args: {
		children: [
			<Notice.Title key="title">Just a title</Notice.Title>,
			<Notice.CloseIconButton key="closeIconButton" />,
		],
	},
};

/**
 * Description only, no title or actions.
 */
export const DescriptionOnly: Story = {
	args: {
		intent: 'info',
		children: [
			<Notice.Description key="description">
				Just a description without title or actions.
			</Notice.Description>,
			<Notice.CloseIconButton key="closeIconButton" />,
		],
	},
};

/**
 * Pass a custom icon via the `icon` prop to override the default intent icon.
 */
export const CustomIcon: Story = {
	args: {
		intent: 'info',
		icon: unseen,
		children: [
			<Notice.Description key="description">
				Parent block is hidden on Desktop
			</Notice.Description>,
		],
	},
};
