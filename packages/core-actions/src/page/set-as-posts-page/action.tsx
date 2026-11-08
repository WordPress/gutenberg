import { __, sprintf } from '@wordpress/i18n';
import { getItemTitle } from '../../shared/utils';
import { hasActionLink } from '../../shared/has-action-link';
import type { BasePost, ActionScriptParts } from '../../shared/types';
import { SetSitePageModal } from '../set-site-page-modal';
import type { SetSitePageModalProps } from '../set-site-page-modal';

/**
 * The question of the modal, with a warning about the current posts page, or
 * about the latest posts the page will show.
 */
const getText: SetSitePageModalProps[ 'getText' ] = ( {
	pageTitle,
	currentPage,
} ) =>
	sprintf(
		// translators: %1$s: title of the page to be set as the posts page, %2$s: posts page replacement warning message.
		__( 'Set "%1$s" as the posts page? %2$s' ),
		pageTitle,
		currentPage
			? sprintf(
					// translators: %s: title of the current posts page.
					__( 'This will replace the current posts page: "%s"' ),
					getItemTitle( currentPage, '' )
				)
			: __( 'This page will show the latest posts.' )
	);

const setAsPostsPage: ActionScriptParts< BasePost > = {
	isEligible( post ) {
		// The server adds the link to the published pages the user can set as
		// the posts page, which are neither the homepage nor the posts page.
		// The status is checked too, as the editor shows the actions of the
		// edited page.
		return (
			post.status === 'publish' &&
			hasActionLink( post, 'wp:action-set-posts-page' )
		);
	},
	RenderModal: ( { items, closeModal } ) => {
		// translators: Button label to confirm setting the specified page as the posts page.
		const submitLabel = __( 'Set posts page' );

		return (
			<SetSitePageModal
				setting="page_for_posts"
				items={ items }
				closeModal={ closeModal }
				getText={ getText }
				submitLabel={ submitLabel }
				successNotice={ __( 'Posts page updated.' ) }
				errorNotice={ __(
					'An error occurred while setting the posts page.'
				) }
			/>
		);
	},
};

/**
 * The JavaScript parts of the action setting a page as the posts page; its
 * data is in `action.php`.
 */
export default setAsPostsPage;
