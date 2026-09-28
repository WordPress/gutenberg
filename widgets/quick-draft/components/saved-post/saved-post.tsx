import { createInterpolateElement } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button, EmptyState, LinkButton, Stack } from '@wordpress/ui';
import styles from './saved-post.module.css';

type SavedPostProps = {
	postId: number;
	postTitle: string;
	onWriteAnother: () => void;
};

export function SavedPost( {
	postId,
	postTitle,
	onWriteAnother,
}: SavedPostProps ) {
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
				<EmptyState.Icon icon={ check } className={ styles.icon } />
				<EmptyState.Title>{ __( 'Draft saved' ) }</EmptyState.Title>
				<EmptyState.Description>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: post title */
							__(
								'<strong>"%s"</strong> is ready to keep editing.'
							),
							postTitle
						),
						{
							strong: <strong />,
						}
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<LinkButton
						variant="solid"
						size="compact"
						href={ editUrl }
						openInNewTab
					>
						{ __( 'Continue editing' ) }
					</LinkButton>
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
