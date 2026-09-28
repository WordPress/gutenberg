import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
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
		const title = 'Changes not saved';
		const description =
			'Your changes could not be saved because the connection was lost. Check your connection and try again.';

		function saveChanges() {
			setHasError( true );
			speak( `${ title }. ${ description }`, 'assertive' );
		}
		return (
			<Stack direction="column" gap="md">
				<Button onClick={ saveChanges }>Save changes</Button>
				{ hasError && (
					<Notice.Root intent="error">
						<Notice.Title>{ title }</Notice.Title>
						<Notice.Description>{ description }</Notice.Description>
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
		const title = 'Draft saved';
		const description = 'Your draft has been saved.';

		function saveDraft() {
			setIsSaved( true );
			speak( `${ title }. ${ description }`, 'polite' );
		}

		return (
			<Stack direction="column" gap="md">
				<Button onClick={ saveDraft }>Save draft</Button>
				{ isSaved && (
					<Notice.Root intent="success">
						<Notice.Title>{ title }</Notice.Title>
						<Notice.Description>{ description }</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton
								onClick={ () => setIsSaved( false ) }
							>
								Dismiss
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				) }
			</Stack>
		);
	},
};
