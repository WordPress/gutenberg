import { speak } from '@wordpress/a11y';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, VisuallyHidden } from '@wordpress/ui';

/**
 * Warns that the page being edited is the posts page chosen in the reading
 * settings, so visitors see the latest posts there rather than its content.
 */
export default function PostsPageNotice() {
	const message = __(
		'You are currently editing the page that shows your latest posts.'
	);

	// `Notice.Root` does not announce itself, so announce the notice when it
	// is shown.
	useEffect( () => {
		speak( message );
	}, [ message ] );

	return (
		<Notice.Root className="editor-posts-page-notice" intent="warning">
			<VisuallyHidden>{ __( 'Warning notice' ) }</VisuallyHidden>
			<Notice.Description>{ message }</Notice.Description>
		</Notice.Root>
	);
}
