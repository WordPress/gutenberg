/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button, EmptyState, Link, Stack } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import styles from './saved-post.module.css';

type SavedPostProps = {
	postId: number;
	onWriteAnother: () => void;
};

export function SavedPost( { postId, onWriteAnother }: SavedPostProps ) {
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
					{ __( 'Your post is ready to keep editing.' ) }
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
