import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import * as Notice from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

type StoryArgs = {
	message: string;
	details: string;
};

const meta: Meta< StoryArgs > = {
	title: 'Components/@wordpress-ui/Notice/Disclosure',
	id: 'design-system-components-notice-disclosure',
	tags: [ '!autodocs', 'docs-only' ],
	argTypes: {
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

function CopyButton( { text }: { text: string } ) {
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
				Copy error
			</Notice.ActionButton>
			<Notice.Description role="status">
				{ hasCopied ? 'Copied' : '' }
			</Notice.Description>
		</>
	);
}

export const WithDetails: Story = {
	args: {
		message: 'Updating failed. Please try updating again.',
		details:
			'The title was rejected by a server-side rule.\nRemove "Break save" from the title, then try again.',
	},
	render: function NoticeWithDetails( { message, details } ) {
		const hasDetails = details.trim().length > 0;

		return (
			<Notice.Root intent="error">
				<Notice.Description
					render={ <Stack direction="column" gap="sm" /> }
					style={ { overflowWrap: 'anywhere' } }
				>
					<div>{ message }</div>
					{ hasDetails && (
						<details>
							<summary>Details</summary>
							<Text
								render={ <pre /> }
								style={ {
									marginBlockStart:
										'var(--wpds-dimension-gap-sm)',
									whiteSpace: 'pre-wrap',
								} }
							>
								{ details }
							</Text>
						</details>
					) }
				</Notice.Description>
				<Notice.Actions render={ <Stack align="center" /> }>
					<CopyButton
						text={
							hasDetails
								? `${ message }\n\n${ details }`
								: message
						}
					/>
				</Notice.Actions>
			</Notice.Root>
		);
	},
};
