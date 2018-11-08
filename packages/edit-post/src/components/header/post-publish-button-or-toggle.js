/**
 * External Dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies.
 */
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { PostPublishButton } from '@wordpress/editor';
import { withViewportMatch } from '@wordpress/viewport';

export function PostPublishButtonOrToggle( {
	forceIsDirty,
	forceIsSaving,
	hasPublishAction,
	isBeingScheduled,
	isLessThanMediumViewport,
	isPending,
	isPublished,
	isPublishSidebarEnabled,
	isPublishSidebarOpened,
	isScheduled,
	togglePublishSidebar,
} ) {
	const IS_TOGGLE = 'toggle';
	const IS_BUTTON = 'button';
	let component;
	/**
	 * We want to show a BUTTON when the post status is at the _final stage_
	 * for a particular role (see https://codex.wordpress.org/Post_Status):
	 *
	 * - is published
	 * - is scheduled to be published
	 * - is pending and can't be published (but only for viewports >= medium)
	 *
	 * Originally we considered showing a button for pending posts
	 * that couldn't be published (for ex, for a contributor role).
	 * Some languages can have really long translations for "Submit for review",
	 * so given the lack of UI real state we decided to take into account the viewport
	 * in that particular case.
	 */
	/**
	 * Then, we take other things into account:
	 *
	 * - Show TOGGLE if it is small viewport.
	 * - Otherwise, use publish sidebar status to decide - TOGGLE if enabled, BUTTON if not.
	 */
	if (
		isPublished ||
		( isScheduled && isBeingScheduled ) ||
		( isPending && ! hasPublishAction && ! isLessThanMediumViewport )
	) {
		component = IS_BUTTON;
	} else if ( isLessThanMediumViewport ) {
		component = IS_TOGGLE;
	} else if ( isPublishSidebarEnabled ) {
		component = IS_TOGGLE;
	} else {
		component = IS_BUTTON;
	}

	return (
		<PostPublishButton
			forceIsDirty={ forceIsDirty }
			forceIsSaving={ forceIsSaving }
			isOpen={ isPublishSidebarOpened }
			isToggle={ component === IS_TOGGLE }
			onToggle={ togglePublishSidebar }
		/>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		hasPublishAction: get(
			select( 'core/editor' ).getCurrentPost(),
			[ '_links', 'wp:action-publish' ],
			false
		),
		isBeingScheduled: select( 'core/editor' ).isEditedPostBeingScheduled(),
		isPending: select( 'core/editor' ).isCurrentPostPending(),
		isPublished: select( 'core/editor' ).isCurrentPostPublished(),
		isPublishSidebarEnabled: select( 'core/editor' ).isPublishSidebarEnabled(),
		isPublishSidebarOpened: select( 'core/edit-post' ).isPublishSidebarOpened(),
		isScheduled: select( 'core/editor' ).isCurrentPostScheduled(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { togglePublishSidebar } = dispatch( 'core/edit-post' );
		return {
			togglePublishSidebar,
		};
	} ),
	withViewportMatch( { isLessThanMediumViewport: '< medium' } ),
)( PostPublishButtonOrToggle );
