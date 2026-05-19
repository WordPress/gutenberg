/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { pencil } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button, EmptyState, Link, Stack } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import styles from './existing-draft-prompt.module.css';

type ExistingDraftPromptProps = {
	postId: number;
	postTitle: string;
	onWriteAnother: () => void;
};

export function ExistingDraftPrompt( {
	postId,
	postTitle,
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
				<EmptyState.Icon icon={ pencil } />
				<EmptyState.Title>
					{ __( 'You already saved a draft today' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: post title */
							__(
								'Pick up where you left off on <strong>"%s"</strong> or start a new one.'
							),
							postTitle
						),
						{
							strong: <strong />,
						}
					) }
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
