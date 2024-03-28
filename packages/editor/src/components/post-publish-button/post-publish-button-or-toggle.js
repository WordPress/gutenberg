/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostPublishButton from './index';
import { store as editorStore } from '../../store';

const IS_TOGGLE = 'toggle';
const IS_BUTTON = 'button';

export default function PostPublishButtonOrToggle( {
	forceIsDirty,
	setEntitiesSavedStatesCallback,
} ) {
	const { togglePublishSidebar } = useDispatch( editorStore );
	const {
		hasPublishAction,
		isBeingScheduled,
		isPending,
		isPublished,
		isScheduled,
		isPublishSidebarEnabled,
		isPublishSidebarOpened,
	} = useSelect( ( select ) => {
		const {
			getCurrentPost,
			isEditedPostBeingScheduled,
			isCurrentPostPublished,
			isCurrentPostPending,
			isCurrentPostScheduled,
		} = select( editorStore );
		return {
			hasPublishAction:
				getCurrentPost()?._links?.[ 'wp:action-publish' ] ?? false,
			isBeingScheduled: isEditedPostBeingScheduled(),
			isPending: isCurrentPostPending(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isPublishSidebarEnabled:
				select( editorStore ).isPublishSidebarEnabled(),
			isPublishSidebarOpened:
				select( editorStore ).isPublishSidebarOpened(),
		};
	}, [] );
	const isSmallerThanMediumViewport = useViewportMatch( 'medium', '<' );
	let component;

	/**
	 * Conditions to show a BUTTON (publish directly) or a TOGGLE (open publish sidebar):
	 *
	 * 1) We want to show a BUTTON when the post status is at the _final stage_
	 * for a particular role (see https://wordpress.org/documentation/article/post-status/):
	 *
	 * - is published
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
		( isScheduled && isBeingScheduled ) ||
		( isPending && ! hasPublishAction && ! isSmallerThanMediumViewport )
	) {
		component = IS_BUTTON;
	} else if ( isSmallerThanMediumViewport ) {
		component = IS_TOGGLE;
	} else if ( isPublishSidebarEnabled ) {
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
