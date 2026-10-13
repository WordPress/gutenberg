import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { check, copy } from '@wordpress/icons';
import { IconButton } from '../../icon-button';
import { Text } from '../../text';
import * as Collapsible from '../../collapsible';
import * as Notice from '../index';

type StoryArgs = ComponentProps< typeof Notice.Root > & {
	message: string;
	details: string;
	copyButton?: 'icon' | 'text';
	actionsAtBottom?: boolean;
};

const meta: Meta< StoryArgs > = {
	title: 'Components/@wordpress-ui/Notice/Disclosure',
	id: 'design-system-components-notice-disclosure',
	component: Notice.Root,
	tags: [ '!autodocs' ],
	parameters: { controls: { include: [ 'intent', 'message', 'details' ] } },
	argTypes: {
		message: { control: 'text' },
		details: { control: 'text' },
	},
};
export default meta;

type Story = StoryObj< StoryArgs >;

function CopyDetailsButton( {
	details,
	presentation,
}: {
	details: string;
	presentation: 'icon' | 'text';
} ) {
	const [ copied, setCopied ] = useState( false );
	const copyRef = useCopyToClipboard< HTMLButtonElement >( details, () => {
		setCopied( true );
		speak( 'Details copied to clipboard.', 'polite' );
	} );

	if ( presentation === 'text' ) {
		return (
			<>
				<Notice.ActionButton ref={ copyRef } variant="outline">
					Copy details
				</Notice.ActionButton>
				{ copied && (
					<Text
						variant="body-sm"
						aria-hidden="true"
						style={ { alignSelf: 'center' } }
					>
						Copied
					</Text>
				) }
			</>
		);
	}

	return (
		<IconButton
			ref={ copyRef }
			label="Copy details"
			icon={ copied ? check : copy }
			size="compact"
			variant="outline"
			tone="neutral"
		/>
	);
}

export const WithDetails: Story = {
	args: {
		intent: 'error',
		message: 'Updating failed. Please try updating again.',
		details:
			'The title was rejected by a server-side rule.\nRemove "Break save" from the title, then try again.',
	},
	render: function NoticeWithDetails( {
		intent,
		message,
		details,
		copyButton = 'icon',
		actionsAtBottom = false,
	} ) {
		const [ open, setOpen ] = useState( false );

		const actions = (
			<Notice.Actions key="actions">
				<Collapsible.Trigger
					render={ <Notice.ActionButton variant="outline" /> }
				>
					{ open ? 'Hide details' : 'Show details' }
				</Collapsible.Trigger>
				<CopyDetailsButton
					key={ details }
					details={ details }
					presentation={ copyButton }
				/>
			</Notice.Actions>
		);
		const panel = (
			<Collapsible.Panel
				key="details"
				hiddenUntilFound
				render={ <Notice.Description render={ <div /> } /> }
				style={ {
					marginBlockStart: 'var(--wpds-dimension-gap-sm)',
					whiteSpace: 'pre-wrap',
					overflowWrap: 'anywhere',
				} }
			>
				{ details }
			</Collapsible.Panel>
		);

		return (
			<Collapsible.Root
				open={ open }
				onOpenChange={ setOpen }
				render={ <Notice.Root intent={ intent } /> }
			>
				<Notice.Description>{ message }</Notice.Description>
				{ actionsAtBottom ? [ panel, actions ] : [ actions, panel ] }
			</Collapsible.Root>
		);
	},
};

export const TextCopyButton: Story = {
	...WithDetails,
	args: { ...WithDetails.args, copyButton: 'text' },
};

export const ActionsAtBottom: Story = {
	...WithDetails,
	args: { ...WithDetails.args, actionsAtBottom: true },
};

export const TextCopyButtonWithActionsAtBottom: Story = {
	...WithDetails,
	args: {
		...WithDetails.args,
		copyButton: 'text',
		actionsAtBottom: true,
	},
};
