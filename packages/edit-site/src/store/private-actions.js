/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';

/**
 * Action that switches the canvas mode.
 *
 * @param {?string} mode Canvas mode.
 */
export const setCanvasMode =
	( mode ) =>
	( { registry, dispatch } ) => {
		const isMediumOrBigger =
			window.matchMedia( '(min-width: 782px)' ).matches;
		registry.dispatch( blockEditorStore ).__unstableSetEditorMode( 'edit' );
		const isPublishSidebarOpened = registry
			.select( editorStore )
			.isPublishSidebarOpened();
		dispatch( {
			type: 'SET_CANVAS_MODE',
			mode,
		} );
		const isEditMode = mode === 'edit';
		if ( isPublishSidebarOpened && ! isEditMode ) {
			registry.dispatch( editorStore ).closePublishSidebar();
		}

		// Check if the block list view should be open by default.
		// If `distractionFree` mode is enabled, the block list view should not be open.
		// This behavior is disabled for small viewports.
		if (
			isMediumOrBigger &&
			isEditMode &&
			registry
				.select( preferencesStore )
				.get( 'core', 'showListViewByDefault' ) &&
			! registry
				.select( preferencesStore )
				.get( 'core', 'distractionFree' )
		) {
			registry.dispatch( editorStore ).setIsListViewOpened( true );
		} else {
			registry.dispatch( editorStore ).setIsListViewOpened( false );
		}
		registry.dispatch( editorStore ).setIsInserterOpened( false );
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
