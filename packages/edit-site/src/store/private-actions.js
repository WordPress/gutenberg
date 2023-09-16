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
 * Action that set the Patterns page has been accessed.
 *
 * @param {boolean} didAccessPatternsPage whether the Patterns page
 *                                        was accessed or not.
 */
export const setDidAccessPatternsPage =
	( didAccessPatternsPage ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_DID_ACCESS_PATTERNS_PAGE',
			didAccessPatternsPage,
		} );
	};
