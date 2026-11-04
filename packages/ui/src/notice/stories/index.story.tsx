import type { Meta, StoryObj } from '@storybook/react-vite';
import { tip, unseen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { Button } from '../../button';
import { Stack } from '../../stack';
import * as Notice from '../index';

const meta: Meta< typeof Notice.Root > = {
	title: 'Components/@wordpress-ui/Notice',
	id: 'design-system-components-notice',
	component: Notice.Root,
	tags: [ 'manifest' ],
	subcomponents: {
		'Notice.List': Notice.List,
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
					'Use Notice.List for announcements of dynamic notices. Standalone notices stay silent. See [Notice announcements](?path=/docs/design-system-components-notice-announcements--docs) for examples and migration guidance. See [Notice with disclosed details](?path=/docs/design-system-components-notice-disclosure--docs) for a composition with native details and a copy button.',
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

/**
 * Use an info notice with the tip icon for contextual guidance.
 */
export const Tip: Story = {
	args: {
		intent: 'info',
		icon: tip,
		children: [
			<Notice.Description key="description">
				While writing, you can press <kbd>/</kbd> to quickly insert new
				blocks.
			</Notice.Description>,
		],
	},
};

type Message = {
	id: number;
	intent: 'success' | 'error';
	description: string;
	politeness?: 'polite' | 'assertive';
	spokenMessage?: string;
};

export const DynamicNotices: StoryObj< typeof Notice.List > = {
	args: { className: '', style: {} },
	argTypes: {
		className: { control: 'text' },
		style: { control: 'object' },
	},
	parameters: { controls: { include: [ 'className', 'style' ] } },
	render: function DynamicNoticesExample( args ) {
		const [ messages, setMessages ] = useState< Message[] >( [
			{
				id: 0,
				intent: 'success',
				description: 'This notice was present when the list mounted.',
			},
		] );
		const [ nextId, setNextId ] = useState( 1 );

		function addNotice( isUrgent: boolean ) {
			setMessages( ( previous ) => [
				...previous,
				{
					id: nextId,
					intent: isUrgent ? 'error' : 'success',
					description: isUrgent
						? 'The connection was lost. Check your connection and try again.'
						: 'Your draft has been saved.',
					politeness: isUrgent ? 'assertive' : 'polite',
				},
			] );
			setNextId( ( previous ) => previous + 1 );
		}

		return (
			<Stack direction="column" gap="md">
				<Stack gap="sm" wrap="wrap">
					<Button onClick={ () => addNotice( false ) }>
						Save draft
					</Button>
					<Button onClick={ () => addNotice( true ) }>
						Simulate failed save
					</Button>
					<Button
						disabled={ ! messages.length }
						onClick={ () =>
							setMessages( ( previous ) =>
								previous.map( ( message, index ) =>
									index === previous.length - 1
										? {
												...message,
												spokenMessage:
													'The latest notice has been updated.',
												description:
													'The latest notice has been updated.',
											}
										: message
								)
							)
						}
					>
						Update latest notice
					</Button>
				</Stack>
				<Notice.List { ...args }>
					{ messages.map( ( message ) => (
						<Notice.Root
							key={ message.id }
							intent={ message.intent }
							politeness={ message.politeness }
							spokenMessage={ message.spokenMessage }
						>
							<Notice.Title>
								{ message.intent === 'error'
									? 'Changes not saved'
									: 'Draft saved' }
							</Notice.Title>
							<Notice.Description>
								{ message.description }
							</Notice.Description>
							<Notice.Actions>
								<Notice.ActionButton
									onClick={ () => addNotice( false ) }
								>
									Save again
								</Notice.ActionButton>
							</Notice.Actions>
							<Notice.CloseIconButton
								onClick={ () =>
									setMessages( ( previous ) =>
										previous.filter(
											( item ) => item.id !== message.id
										)
									)
								}
							/>
						</Notice.Root>
					) ) }
				</Notice.List>
			</Stack>
		);
	},
};
