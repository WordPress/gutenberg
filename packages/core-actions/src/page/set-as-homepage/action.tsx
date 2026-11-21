import { __, sprintf } from '@wordpress/i18n';
import { getItemTitle } from '../../shared/utils';
import { hasActionLink } from '../../shared/has-action-link';
import type { BasePost, ActionScriptParts } from '../../shared/types';
import { SetSitePageModal } from '../set-site-page-modal';
import type { SetSitePageModalProps } from '../set-site-page-modal';

/**
 * The question of the modal, with a warning about the current homepage, or
 * about the latest posts the site shows instead of one.
 */
const getText: SetSitePageModalProps[ 'getText' ] = ( {
	pageTitle,
	currentPage,
	siteSettings,
} ) => {
	let warning = '';
	if ( 'posts' === siteSettings?.show_on_front ) {
		warning = __(
			'This will replace the current homepage which is set to display latest posts.'
		);
	} else if ( currentPage ) {
		warning = sprintf(
			// translators: %s: title of the current home page.
			__( 'This will replace the current homepage: "%s"' ),
			getItemTitle( currentPage, '' )
		);
	}

	return sprintf(
		// translators: %1$s: title of the page to be set as the homepage, %2$s: homepage replacement warning message.
		__( 'Set "%1$s" as the site homepage? %2$s' ),
		pageTitle,
		warning
	).trim();
};

const setAsHomepage: ActionScriptParts< BasePost > = {
	isEligible( post ) {
		// The server adds the link to the published pages the user can set as
		// the homepage, which are neither the homepage nor the posts page. The
		// status is checked too, as the editor shows the actions of the edited
		// page.
		return (
			post.status === 'publish' &&
			hasActionLink( post, 'wp:action-set-homepage' )
		);
	},
	RenderModal: ( { items, closeModal } ) => {
		// translators: Button label to confirm setting the specified page as the homepage.
		const submitLabel = __( 'Set homepage' );

		return (
			<SetSitePageModal
				setting="page_on_front"
				items={ items }
				closeModal={ closeModal }
				getText={ getText }
				submitLabel={ submitLabel }
				successNotice={ __( 'Homepage updated.' ) }
				errorNotice={ __(
					'An error occurred while setting the homepage.'
				) }
			/>
		);
	},
};

/**
 * The JavaScript parts of the action setting a page as the homepage; its data
 * is in `action.php`.
 */
export default setAsHomepage;
