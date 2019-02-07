/**
 * External dependencies
 */
import { reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import { select, subscribe, dispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	openGeneralSidebar,
	closeGeneralSidebar,
} from './actions';
import {
	getActiveGeneralSidebarName,
	hasMetaBoxes,
} from './selectors';
import { getMetaBoxContainer } from '../utils/meta-boxes';
import { onChangeListener } from './utils';

const VIEW_AS_LINK_SELECTOR = '#wp-admin-bar-view a';

/**
 * Updates MetaBoxes by making a POST request to post.php.
 *
 * @return {Promise} A promise when the request to update MetaBoxes is
 * 				     complete.
 */
function updateMetaBoxes() {
	// Inidicate that the MetaBox update process has started.
	dispatch( 'core/edit-post' ).metaBoxUpdatesStart();

	// Saves the wp_editor fields
	if ( window.tinyMCE ) {
		window.tinyMCE.triggerSave();
	}

	// Additional data needed for backward compatibility.
	// If we do not provide this data, the post will be overridden with the default values.
	const post = select( 'core/editor' ).getCurrentPost();
	const additionalData = [
		post.comment_status ? [ 'comment_status', post.comment_status ] : false,
		post.ping_status ? [ 'ping_status', post.ping_status ] : false,
		post.sticky ? [ 'sticky', post.sticky ] : false,
		[ 'post_author', post.author ],
	].filter( Boolean );

	// We gather all the metaboxes locations data and the base form data
	const baseFormData = new window.FormData( document.querySelector( '.metabox-base-form' ) );
	const activeMetaBoxLocations = select( 'core/edit-post' ).getActiveMetaBoxLocations();
	const formDataToMerge = [
		baseFormData,
		...activeMetaBoxLocations.map( ( location ) => (
			new window.FormData( getMetaBoxContainer( location ) )
		) ),
	];

	// Merge all form data objects into a single one.
	const formData = reduce( formDataToMerge, ( memo, currentFormData ) => {
		for ( const [ key, value ] of currentFormData ) {
			memo.append( key, value );
		}
		return memo;
	}, new window.FormData() );
	additionalData.forEach( ( [ key, value ] ) => formData.append( key, value ) );

	// Save the metaboxes
	return apiFetch( {
		url: window._wpMetaBoxUrl,
		method: 'POST',
		body: formData,
		parse: false,
	} );
}

/**
 * A function used in a filter to defer post updates until after MetaBoxes
 * have been updated.
 *
 * @param {function} updatePost A function that when called, updates the post.
 * @param {Object}   options    An object providing options about the post
 * 								udpate.
 *
 * @return {function} A function that when called updates MetaBoxes (if needed)
 * 					  and then updates the post.
 */
function updateMetaBoxesFilter( updatePost, { isPreview, isAutosave } ) {
	// Don't carry out a MetaBox update for automated autosaves.
	if ( isAutosave && ! isPreview ) {
		return updatePost;
	}

	// Return a function that defers the post update until after MetaBoxes have been saved.
	return () => updateMetaBoxes().then( () => {
		dispatch( 'core/edit-post' ).metaBoxUpdatesSuccess();
		updatePost();
	} );
}

const effects = {
	REQUEST_META_BOX_UPDATES() {
		updateMetaBoxes();
	},
	SET_META_BOXES_PER_LOCATIONS( action, store ) {
		// Allow toggling metaboxes panels
		// We need to wait for all scripts to load
		// If the meta box loads the post script, it will already trigger this.
		// After merge in Core, make sure to drop the timeout and update the postboxes script
		// to avoid the double binding.
		setTimeout( () => {
			const postType = select( 'core/editor' ).getCurrentPostType();
			if ( window.postboxes.page !== postType ) {
				window.postboxes.add_postbox_toggles( postType );
			}
		} );

		if ( hasMetaBoxes( store.getState() ) ) {
			addFilter(
				'editor.updatePost',
				'core/edit-post/store/effects/update-meta-boxes',
				updateMetaBoxesFilter
			);
		}
	},
	SWITCH_MODE( action ) {
		// Unselect blocks when we switch to the code editor.
		if ( action.mode !== 'visual' ) {
			dispatch( 'core/editor' ).clearSelectedBlock();
		}

		const message = action.mode === 'visual' ? __( 'Visual editor selected' ) : __( 'Code editor selected' );
		speak( message, 'assertive' );
	},
	INIT( _, store ) {
		// Select the block settings tab when the selected block changes
		subscribe( onChangeListener(
			() => !! select( 'core/editor' ).getBlockSelectionStart(),
			( hasBlockSelection ) => {
				if ( ! select( 'core/edit-post' ).isEditorSidebarOpened() ) {
					return;
				}
				if ( hasBlockSelection ) {
					store.dispatch( openGeneralSidebar( 'edit-post/block' ) );
				} else {
					store.dispatch( openGeneralSidebar( 'edit-post/document' ) );
				}
			} )
		);

		const isMobileViewPort = () => select( 'core/viewport' ).isViewportMatch( '< medium' );
		const adjustSidebar = ( () => {
			// contains the sidebar we close when going to viewport sizes lower than medium.
			// This allows to reopen it when going again to viewport sizes greater than medium.
			let sidebarToReOpenOnExpand = null;
			return ( isSmall ) => {
				if ( isSmall ) {
					sidebarToReOpenOnExpand = getActiveGeneralSidebarName( store.getState() );
					if ( sidebarToReOpenOnExpand ) {
						store.dispatch( closeGeneralSidebar() );
					}
				} else if ( sidebarToReOpenOnExpand && ! getActiveGeneralSidebarName( store.getState() ) ) {
					store.dispatch( openGeneralSidebar( sidebarToReOpenOnExpand ) );
				}
			};
		} )();

		adjustSidebar( isMobileViewPort() );

		// Collapse sidebar when viewport shrinks.
		// Reopen sidebar it if viewport expands and it was closed because of a previous shrink.
		subscribe( onChangeListener( isMobileViewPort, adjustSidebar ) );

		// Update View as link when currentPost link changes
		const updateViewAsLink = ( newPermalink ) => {
			if ( ! newPermalink ) {
				return;
			}

			const nodeToUpdate = document.querySelector(
				VIEW_AS_LINK_SELECTOR
			);
			if ( ! nodeToUpdate ) {
				return;
			}
			nodeToUpdate.setAttribute( 'href', newPermalink );
		};

		subscribe( onChangeListener(
			() => select( 'core/editor' ).getCurrentPost().link,
			updateViewAsLink
		) );
	},

};

export default effects;
