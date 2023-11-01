/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Action that switches the canvas mode.
 *
 * @param {?string} mode Canvas mode.
 */
export const setCanvasMode =
	( mode ) =>
	( { registry, dispatch, select } ) => {
		registry.dispatch( blockEditorStore ).__unstableSetEditorMode( 'edit' );
		dispatch( {
			type: 'SET_CANVAS_MODE',
			mode,
		} );
		// Check if the block list view should be open by default.
		// If `distractionFree` mode is enabled, the block list view should not be open.
		if (
			mode === 'edit' &&
			registry
				.select( preferencesStore )
				.get( 'core/edit-site', 'showListViewByDefault' ) &&
			! registry
				.select( preferencesStore )
				.get( 'core/edit-site', 'distractionFree' )
		) {
			dispatch.setIsListViewOpened( true );
		}
		// Switch focus away from editing the template when switching to view mode.
		if ( mode === 'view' && select.isPage() ) {
			dispatch.setHasPageContentFocus( true );
		}
	};

/**
 * Action that switches the editor canvas container view.
 *
 * @param {?string} view Editor canvas container view.
 */
export const setEditorCanvasContainerView =
	( view ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_EDITOR_CANVAS_CONTAINER_VIEW',
			view,
		} );
	};

/**
 * Sets the type of page content focus. Can be one of:
 *
 * - `'disableTemplate'`: Disable the blocks belonging to the page's template.
 * - `'hideTemplate'`: Hide the blocks belonging to the page's template.
 *
 * @param {'disableTemplate'|'hideTemplate'} pageContentFocusType The type of page content focus.
 *
 * @return {Object} Action object.
 */
export const setPageContentFocusType =
	( pageContentFocusType ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_PAGE_CONTENT_FOCUS_TYPE',
			pageContentFocusType,
		} );
	};
