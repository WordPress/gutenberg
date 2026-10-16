import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useEffect, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { Text } from '../../text';
import * as Collapsible from '../../collapsible';
import * as Notice from '../index';

type StoryArgs = Pick< ComponentProps< typeof Notice.Root >, 'intent' > & {
	message: string;
	details: string;
};

const meta: Meta< StoryArgs > = {
	title: 'Components/@wordpress-ui/Notice/Disclosure',
	id: 'design-system-components-notice-disclosure',
	tags: [ '!autodocs', 'docs-only' ],
	argTypes: {
		intent: {
			control: 'select',
			options: [ 'neutral', 'info', 'warning', 'success', 'error' ],
			description: 'Passed to Notice.Root to set the notice intent.',
		},
		message: {
			control: 'text',
			description: 'Example content rendered inside Notice.Description.',
		},
		details: {
			control: 'text',
			description: 'Example content revealed by the disclosure.',
		},
	},
};
export default meta;

type Story = StoryObj< StoryArgs >;

const CONFIRMATION_TIMEOUT = 4000;

function CopyButton( { text, label }: { text: string; label: string } ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyRef = useCopyToClipboard< HTMLButtonElement >( text, () => {
		setHasCopied( true );
	} );

	useEffect( () => {
		setHasCopied( false );
	}, [ text ] );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}

		const timeoutId = setTimeout( () => {
			setHasCopied( false );
		}, CONFIRMATION_TIMEOUT );

		return () => clearTimeout( timeoutId );
	}, [ hasCopied ] );

	return (
		<>
			<Notice.ActionButton ref={ copyRef } variant="outline">
				{ label }
			</Notice.ActionButton>
			<Text
				variant="body-sm"
				role="status"
				style={ {
					alignSelf: 'center',
					color: 'var(--wp-ui-notice-text-color)',
				} }
			>
				{ hasCopied ? 'Copied' : '' }
			</Text>
		</>
	);
}

export const WithDetails: Story = {
	args: {
		intent: 'error',
		message: 'Updating failed. Please try updating again.',
		details:
			'The title was rejected by a server-side rule.\nRemove "Break save" from the title, then try again.',
	},
	render: function NoticeWithDetails( { intent, message, details } ) {
		const [ open, setOpen ] = useState( false );
		const hasDetails = details.trim().length > 0;

		return (
			<Collapsible.Root
				open={ open }
				onOpenChange={ setOpen }
				render={ <Notice.Root intent={ intent } /> }
			>
				<Notice.Description>{ message }</Notice.Description>
				<Notice.Actions>
					{ hasDetails && (
						<Collapsible.Trigger
							render={ <Notice.ActionButton variant="outline" /> }
						>
							{ open ? 'Hide details' : 'Show details' }
						</Collapsible.Trigger>
					) }
					<CopyButton
						text={
							hasDetails
								? `${ message }\n\n${ details }`
								: message
						}
						label={
							intent === 'error' ? 'Copy error' : 'Copy message'
						}
					/>
				</Notice.Actions>
				{ hasDetails && (
					<Collapsible.Panel
						render={ <Notice.Description render={ <div /> } /> }
						style={ {
							marginBlockStart: 'var(--wpds-dimension-gap-sm)',
							whiteSpace: 'pre-wrap',
							overflowWrap: 'anywhere',
						} }
					>
						{ details }
					</Collapsible.Panel>
				) }
			</Collapsible.Root>
		);
	},
};

export const WithNativeDetails: Story = {
	args: WithDetails.args,
	render: function NoticeWithNativeDetails( { intent, message, details } ) {
		const hasDetails = details.trim().length > 0;

		return (
			<Notice.Root intent={ intent }>
				<Notice.Description>{ message }</Notice.Description>
				{ hasDetails && (
					<Notice.Description
						render={ <details /> }
						style={ {
							marginBlockStart: 'var(--wpds-dimension-gap-sm)',
							overflowWrap: 'anywhere',
						} }
					>
						<summary style={ { cursor: 'pointer' } }>
							Details
						</summary>
						<div
							style={ {
								marginBlockStart:
									'var(--wpds-dimension-gap-sm)',
								whiteSpace: 'pre-wrap',
							} }
						>
							{ details }
						</div>
					</Notice.Description>
				) }
				<Notice.Actions>
					<CopyButton
						text={
							hasDetails
								? `${ message }\n\n${ details }`
								: message
						}
						label={
							intent === 'error' ? 'Copy error' : 'Copy message'
						}
					/>
				</Notice.Actions>
			</Notice.Root>
		);
	},
};
