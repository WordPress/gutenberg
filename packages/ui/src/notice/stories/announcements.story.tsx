import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Button } from '../../button';
import { Stack } from '../../stack';
import * as Notice from '../index';

const meta: Meta< typeof Notice.Root > = {
	title: 'Design System/Components/Notice/Announcements',
	component: Notice.Root,
	tags: [ '!autodocs' ],
	parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj< typeof Notice.Root >;

export const StaticNotice: Story = {
	render: () => (
		<Notice.Root intent="info">
			<Notice.Description>
				Your site is private. Only invited people can view it.
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href="https://wordpress.org/documentation/">
					Learn more
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	),
};

export const UrgentError: Story = {
	render: function UrgentErrorExample() {
		const [ hasError, setHasError ] = useState( false );
		return (
			<Stack direction="column" gap="md">
				<Button onClick={ () => setHasError( true ) }>
					Save changes
				</Button>
				{ hasError && (
					<Notice.Root intent="error">
						<Notice.Description role="alert">
							Your changes could not be saved because the
							connection was lost. Check your connection and try
							again.
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton
								onClick={ () => setHasError( false ) }
							>
								Try again
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				) }
			</Stack>
		);
	},
};

export const PoliteStatus: Story = {
	render: function PoliteStatusExample() {
		const [ isSaved, setIsSaved ] = useState( false );
		return (
			<Notice.Root intent="success">
				<Notice.Title>Draft status</Notice.Title>
				<Notice.Description role="status">
					{ isSaved ? 'Your draft has been saved.' : '' }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						onClick={ () => setIsSaved( ! isSaved ) }
					>
						{ isSaved ? 'Undo' : 'Save draft' }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	},
};
