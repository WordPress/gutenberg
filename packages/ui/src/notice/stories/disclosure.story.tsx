import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useEffect, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { Text } from '../../text';
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
				style={ { alignSelf: 'center' } }
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
					<CopyButton
						text={ `${ message }\n\n${ details }` }
						label={
							intent === 'error' ? 'Copy error' : 'Copy message'
						}
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
