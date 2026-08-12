import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Notice from '../index';

const meta: Meta< typeof Notice.Root > = {
	title: 'Design System/Components/Notice',
	component: Notice.Root,
	subcomponents: {
		'Notice.Title': Notice.Title,
		'Notice.Description': Notice.Description,
		'Notice.Actions': Notice.Actions,
		'Notice.CloseIcon': Notice.CloseIcon,
		'Notice.ActionButton': Notice.ActionButton,
		'Notice.ActionLink': Notice.ActionLink,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
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
			<Notice.CloseIcon key="closeIcon" />,
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
 * Omit Notice.CloseIcon to make the notice non-dismissable.
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
			<Notice.CloseIcon key="closeIcon" />,
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
			<Notice.CloseIcon key="closeIcon" />,
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
			<Notice.CloseIcon key="closeIcon" />,
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
			<Notice.CloseIcon key="closeIcon" />,
		],
	},
};
