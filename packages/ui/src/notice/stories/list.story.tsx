import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Button } from '../../button';
import { Stack } from '../../stack';
import * as Notice from '../index';

const meta: Meta< typeof Notice.List > = {
	title: 'Components/@wordpress-ui/Notice/List',
	id: 'design-system-components-notice-list',
	component: Notice.List,
	parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj< typeof Notice.List >;
type Message = {
	id: number;
	intent: 'success' | 'error';
	description: string;
	politeness?: 'polite' | 'assertive';
	spokenMessage?: string;
};

export const DynamicNotices: Story = {
	render: function DynamicNoticesExample() {
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
				<Notice.List>
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
