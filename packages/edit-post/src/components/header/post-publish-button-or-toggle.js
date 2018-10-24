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

function PostPublishButtonOrToggle( {
	hasPublishAction,
	isBeingScheduled,
	isPending,
	isPublished,
	isPublishSidebarEnabled,
	isPublishSidebarOpened,
	isScheduled,
	isSmallViewport,
	forceIsDirty,
	forceIsSaving,
	togglePublishSidebar,
} ) {
	const shouldUseButton = (
		( ! isPublishSidebarEnabled && ! isSmallViewport ) ||
		isPublished ||
		( isScheduled && isBeingScheduled ) ||
		( isPending && ! hasPublishAction && ! isSmallViewport )
	);

	const component = shouldUseButton ? (
		<PostPublishButton
			forceIsDirty={ forceIsDirty }
			forceIsSaving={ forceIsSaving }
		/>
	) : (
		<PostPublishPanelToggle
			isOpen={ isPublishSidebarOpened }
			onToggle={ togglePublishSidebar }
			forceIsSaving={ forceIsSaving }
		/>
	);
	return component;
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
