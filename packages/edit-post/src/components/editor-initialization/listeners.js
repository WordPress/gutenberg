/**
 * Internal dependencies
 */
import { STORE_KEY, VIEW_AS_LINK_SELECTOR } from '../../store/constants';
import { onChangeListener } from './utils';

/**
 * This listener is used to handle block selection triggering the appropriate
 * sidebar state.
 *
 * @param {Object} registry An instance of the store registry.
 *
 * @return {Function}  A function to pass in as a wp.data.subscribe callback.
 */
export const blockSelectionListener = ( registry ) => onChangeListener(
	() => !! registry.select( 'core/block-editor' )
		.getBlockSelectionStart(),
	( hasBlockSelection ) => {
		if ( ! registry.select( 'core/edit-post' ).isEditorSidebarOpened() ) {
			return;
		}
		if ( hasBlockSelection ) {
			registry.dispatch( STORE_KEY )
				.openGeneralSidebar( 'edit-post/block' );
		} else {
			registry.dispatch( STORE_KEY )
				.openGeneralSidebar( 'edit-post/document' );
		}
	}
);

/**
 * This listener is used to handle adjusting the sidebar according to viewport
 * viewport size.
 *
 * @param {Object} registry An instance of the store registry.
 *
 * @return {Function}  A function to pass in as a wp.data.subscribe callback.
 */
export const adjustSidebarListener = ( registry ) => onChangeListener(
	() => registry.select( 'core/viewport' )
		.isViewportMatch( '< medium' ),
	( () => {
		let sidebarToReOpenOnExpand = null;
		return ( isSmall ) => {
			const { getActiveGeneralSidebarName } = registry.select( STORE_KEY );
			const {
				closeGeneralSidebar: closeSidebar,
				openGeneralSidebar: openSidebar,
			} = registry.dispatch( STORE_KEY );
			if ( isSmall ) {
				sidebarToReOpenOnExpand = getActiveGeneralSidebarName();
				if ( sidebarToReOpenOnExpand ) {
					closeSidebar();
				}
			} else if (
				sidebarToReOpenOnExpand &&
				! getActiveGeneralSidebarName()
			) {
				openSidebar( sidebarToReOpenOnExpand );
			}
		};
	} )(),
	true
);

/**
 * This listener is used to handle updating the "view as" link selector when the
 * post link is changed.
 *
 * @param {Object} registry An instance of the store registry
 *
 * @return {Function} A function to pass in as a wp.data.subscribe callback
 */
export const viewPostLinkUpdateListener = ( registry ) => onChangeListener(
	() => registry.select( 'core/editor' ).getCurrentPost().link,
	( newPermalink ) => {
		if ( ! newPermalink ) {
			return;
		}
		const nodeToUpdate = document.querySelector( VIEW_AS_LINK_SELECTOR );
		if ( ! nodeToUpdate ) {
			return;
		}
		nodeToUpdate.setAttribute( 'href', newPermalink );
	}
);
