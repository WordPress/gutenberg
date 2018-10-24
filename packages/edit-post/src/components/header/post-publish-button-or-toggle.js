/**
 * External Dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies.
 */
import {
	PostPublishPanelToggle,
	PostPublishButton,
} from '@wordpress/editor';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

export function PostPublishButtonOrToggle( {
	isBeingScheduled,
	isPublished,
	isPublishSidebarEnabled,
	isPublishSidebarOpened,
	isScheduled,
	isSmallViewport,
	forceIsDirty,
	forceIsSaving,
	togglePublishSidebar,
} ) {
	const button = (
		<PostPublishButton
			forceIsDirty={ forceIsDirty }
			forceIsSaving={ forceIsSaving } />
	);
	const toggle = (
		<PostPublishPanelToggle
			isOpen={ isPublishSidebarOpened }
			onToggle={ togglePublishSidebar }
			forceIsSaving={ forceIsSaving }
		/>
	);

	/**
     * We want to show a BUTTON when the post status is:
     *
     * - 'publish': isPublished will be true.
     * - 'private': isPublished will be true.
     * - 'future' and post date before now: isPublished will be true.
     * - 'future' and post date equals or after now: isScheduled will be true.
     */
	if ( isPublished || ( isScheduled && isBeingScheduled ) ) {
		return button;
	}

	/**
     * Then, we take other things into account:
     *
     * - Show TOGGLE if it is small viewport.
     * - Otherwise, use publish sidebar status to decide - TOGGLE if enabled, BUTTON if not.
     */
	if ( isSmallViewport ) {
		return toggle;
	}

	return isPublishSidebarEnabled ? toggle : button;
}

export default compose(
	withSelect( ( select ) => ( {
		hasPublishAction: get( select( 'core/editor' ).getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
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
	withViewportMatch( { isSmallViewport: '< medium' } ),
)( PostPublishButtonOrToggle );
