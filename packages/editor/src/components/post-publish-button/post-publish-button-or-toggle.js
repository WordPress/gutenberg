/**
 * WordPress dependencies
 */
import { useViewportMatch, compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostPublishButton from './index';
import { store as editorStore } from '../../store';

export function PostPublishButtonOrToggle( {
	forceIsDirty,
	hasPublishAction,
	isBeingScheduled,
	isPending,
	isPublished,
	isPublishSidebarEnabled,
	isPublishSidebarOpened,
	isScheduled,
	togglePublishSidebar,
	setEntitiesSavedStatesCallback,
	postStatusHasChanged,
	postStatus,
} ) {
	const IS_TOGGLE = 'toggle';
	const IS_BUTTON = 'button';
	const isSmallerThanMediumViewport = useViewportMatch( 'medium', '<' );
	let component;

	/**
	 * Conditions to show a BUTTON (publish directly) or a TOGGLE (open publish sidebar):
	 *
	 * 1) We want to show a BUTTON when the post status is at the _final stage_
	 * for a particular role (see https://wordpress.org/documentation/article/post-status/):
	 *
	 * - is published
	 * - post status has changed explicitely to something different than 'future' or 'publish'
	 * - is scheduled to be published
	 * - is pending and can't be published (but only for viewports >= medium).
	 * 	 Originally, we considered showing a button for pending posts that couldn't be published
	 * 	 (for example, for an author with the contributor role). Some languages can have
	 * 	 long translations for "Submit for review", so given the lack of UI real estate available
	 * 	 we decided to take into account the viewport in that case.
	 *  	 See: https://github.com/WordPress/gutenberg/issues/10475
	 *
	 * 2) Then, in small viewports, we'll show a TOGGLE.
	 *
	 * 3) Finally, we'll use the publish sidebar status to decide:
	 *
	 * - if it is enabled, we show a TOGGLE
	 * - if it is disabled, we show a BUTTON
	 */
	if (
		isPublished ||
		( postStatusHasChanged &&
			! [ 'future', 'publish' ].includes( postStatus ) ) ||
		( isScheduled && isBeingScheduled ) ||
		( isPending && ! hasPublishAction && ! isSmallerThanMediumViewport )
	) {
		component = IS_BUTTON;
	} else if ( isSmallerThanMediumViewport || isPublishSidebarEnabled ) {
		component = IS_TOGGLE;
	} else {
		component = IS_BUTTON;
	}

	return (
		<PostPublishButton
			forceIsDirty={ forceIsDirty }
			isOpen={ isPublishSidebarOpened }
			isToggle={ component === IS_TOGGLE }
			onToggle={ togglePublishSidebar }
			setEntitiesSavedStatesCallback={ setEntitiesSavedStatesCallback }
		/>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		hasPublishAction:
			select( editorStore ).getCurrentPost()?._links?.[
				'wp:action-publish'
			] ?? false,
		isBeingScheduled: select( editorStore ).isEditedPostBeingScheduled(),
		isPending: select( editorStore ).isCurrentPostPending(),
		isPublished: select( editorStore ).isCurrentPostPublished(),
		isPublishSidebarEnabled:
			select( editorStore ).isPublishSidebarEnabled(),
		isPublishSidebarOpened: select( editorStore ).isPublishSidebarOpened(),
		isScheduled: select( editorStore ).isCurrentPostScheduled(),
		postStatus: select( editorStore ).getEditedPostAttribute( 'status' ),
		postStatusHasChanged: select( editorStore ).getPostEdits()?.status,
	} ) ),
	withDispatch( ( dispatch ) => {
		const { togglePublishSidebar } = dispatch( editorStore );
		return {
			togglePublishSidebar,
		};
	} )
)( PostPublishButtonOrToggle );
