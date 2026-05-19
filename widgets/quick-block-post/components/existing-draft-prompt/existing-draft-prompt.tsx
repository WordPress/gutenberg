/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button, EmptyState, Link, Stack } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import styles from './existing-draft-prompt.module.css';

type ExistingDraftPromptProps = {
	postId: number;
	onWriteAnother: () => void;
};

export function ExistingDraftPrompt( {
	postId,
	onWriteAnother,
}: ExistingDraftPromptProps ) {
	const editUrl = addQueryArgs( 'post.php', {
		post: postId,
		action: 'edit',
	} );

	return (
		<Stack
			direction="column"
			align="center"
			justify="center"
			className={ styles.body }
		>
			<EmptyState.Root>
				<EmptyState.Icon icon={ edit } />
				<EmptyState.Title>
					{ __( 'You already saved a draft today' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __( 'Pick up where you left off or start a new one.' ) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button
						variant="solid"
						size="compact"
						nativeButton={ false }
						render={
							<Link
								href={ editUrl }
								openInNewTab
								style={ {
									color: 'var(--wpds-color-fg-interactive-brand-strong)',
								} }
							/>
						}
					>
						{ __( 'Continue editing' ) }
					</Button>
					<Button
						variant="minimal"
						size="compact"
						onClick={ onWriteAnother }
					>
						{ __( 'Write another' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</Stack>
	);
}
