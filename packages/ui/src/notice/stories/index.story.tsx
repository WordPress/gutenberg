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
	render: ( {} ) => (
		<Notice.Root>
			<Notice.Title>Notice Title</Notice.Title>
			<Notice.Description>
				Description text with details about this notification.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

export const Info: Story = {
	render: ( {} ) => (
		<Notice.Root intent="info">
			<Notice.Title>Notice Title</Notice.Title>
			<Notice.Description>
				Description text with details about this notification.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

export const Warning: Story = {
	render: ( {} ) => (
		<Notice.Root intent="warning">
			<Notice.Title>Notice Title</Notice.Title>
			<Notice.Description>
				Description text with details about this notification.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

export const Success: Story = {
	render: ( {} ) => (
		<Notice.Root intent="success">
			<Notice.Title>Notice Title</Notice.Title>
			<Notice.Description>
				Description text with details about this notification.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

export const Error: Story = {
	render: ( {} ) => (
		<Notice.Root intent="error">
			<Notice.Title>Notice Title</Notice.Title>
			<Notice.Description>
				Description text with details about this notification.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Primary button</Notice.ActionButton>
				<Notice.ActionButton variant="outline">
					Secondary button
				</Notice.ActionButton>
				<Notice.ActionLink href="#">Link</Notice.ActionLink>
			</Notice.Actions>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

/**
 * Omit Notice.CloseIcon to make the notice non-dismissable.
 */
export const NonDismissible: Story = {
	render: ( {} ) => (
		<Notice.Root intent="warning">
			<Notice.Title>Action Required</Notice.Title>
			<Notice.Description>
				This notice cannot be dismissed by the user.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Take Action</Notice.ActionButton>
				<Notice.ActionLink href="#">Visit link</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	),
};

/**
 * Pass `icon={ null }` to hide the default decorative icon.
 */
export const WithoutIcon: Story = {
	render: ( {} ) => (
		<Notice.Root intent="info" icon={ null }>
			<Notice.Title>No Icon</Notice.Title>
			<Notice.Description>
				This notice has no decorative icon displayed.
			</Notice.Description>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

export const WithoutActions: Story = {
	render: ( {} ) => (
		<Notice.Root intent="info">
			<Notice.Title>Simple Notice</Notice.Title>
			<Notice.Description>
				A dismissable notice without any action buttons or links.
			</Notice.Description>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

/**
 * Title only, no description or actions.
 */
export const TitleOnly: Story = {
	render: ( {} ) => (
		<Notice.Root>
			<Notice.Title>Just a title</Notice.Title>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};

/**
 * Description only, no title or actions.
 */
export const DescriptionOnly: Story = {
	render: ( {} ) => (
		<Notice.Root intent="info">
			<Notice.Description>
				Just a description without title or actions.
			</Notice.Description>
			<Notice.CloseIcon />
		</Notice.Root>
	),
};
