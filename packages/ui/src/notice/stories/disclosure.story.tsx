import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { check, copy } from '@wordpress/icons';
import { IconButton } from '../../icon-button';
import * as Collapsible from '../../collapsible';
import * as Notice from '../index';

type StoryArgs = ComponentProps< typeof Notice.Root > & {
	message: string;
	details: string;
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

export const WithDetails: Story = {
	args: {
		intent: 'error',
		message: 'Updating failed. Please try updating again.',
		details:
			'The title was rejected by a server-side rule.\nRemove "Break save" from the title, then try again.',
	},
	render: function NoticeWithDetails( { intent, message, details } ) {
		const [ open, setOpen ] = useState( false );
		const [ copiedDetails, setCopiedDetails ] = useState< string >();
		const copyRef = useCopyToClipboard< HTMLButtonElement >(
			details,
			() => {
				setCopiedDetails( details );
				speak( 'Details copied to clipboard.', 'polite' );
			}
		);

		return (
			<Collapsible.Root
				open={ open }
				onOpenChange={ setOpen }
				render={ <Notice.Root intent={ intent } /> }
			>
				<Notice.Description>{ message }</Notice.Description>
				<Notice.Actions>
					<Collapsible.Trigger
						render={ <Notice.ActionButton variant="outline" /> }
					>
						{ open ? 'Hide details' : 'Show details' }
					</Collapsible.Trigger>
					<IconButton
						ref={ copyRef }
						label="Copy details"
						icon={ copiedDetails === details ? check : copy }
						size="compact"
						variant="minimal"
						tone="neutral"
					/>
				</Notice.Actions>
				<Collapsible.Panel
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
			</Collapsible.Root>
		);
	},
};
