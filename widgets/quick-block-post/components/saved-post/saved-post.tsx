/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { Button, Icon, Stack, Text, Link } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components
import { __ } from '@wordpress/i18n';

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
		<Stack direction="column" gap="md" align="center" justify="center">
			<Icon
				icon={ check }
				size={ 64 }
				style={ {
					color: 'var(--wpds-color-fg-content-success)',
				} }
			/>
			<Text variant="heading-md">{ __( 'Draft saved' ) }</Text>
			<Text variant="body-md">
				{ __( 'Your post is ready to keep editing.' ) }
			</Text>
			<Stack direction="row" gap="md" justify="center">
				<Button
					variant="solid"
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

				<Button variant="minimal" onClick={ onWriteAnother }>
					{ __( 'Write another' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
