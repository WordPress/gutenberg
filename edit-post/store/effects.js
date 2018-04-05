/**
 * External dependencies
 */
import { reduce, values, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { select, subscribe } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	metaBoxUpdatesSuccess,
	setMetaBoxSavedData,
	requestMetaBoxUpdates,
	openGeneralSidebar,
	closeGeneralSidebar,
} from './actions';
import { getMetaBoxes, getActiveGeneralSidebarName } from './selectors';
import { getMetaBoxContainer } from '../utils/meta-boxes';
import { onChangeListener } from './utils';

const effects = {
	INITIALIZE_META_BOX_STATE( action, store ) {
		const hasActiveMetaBoxes = some( action.metaBoxes );
		if ( ! hasActiveMetaBoxes ) {
			return;
		}

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

		// Initialize metaboxes state
		const dataPerLocation = reduce( action.metaBoxes, ( memo, isActive, location ) => {
			if ( isActive ) {
				memo[ location ] = jQuery( getMetaBoxContainer( location ) ).serialize();
			}
			return memo;
		}, {} );
		store.dispatch( setMetaBoxSavedData( dataPerLocation ) );

		// Saving metaboxes when saving posts
		subscribe( onChangeListener( select( 'core/editor' ).isSavingPost, ( isSavingPost ) => {
			if ( ! isSavingPost ) {
				store.dispatch( requestMetaBoxUpdates() );
			}
		} ) );
	},
	REQUEST_META_BOX_UPDATES( action, store ) {
		const state = store.getState();
		const dataPerLocation = reduce( getMetaBoxes( state ), ( memo, metabox, location ) => {
			if ( metabox.isActive ) {
				memo[ location ] = jQuery( getMetaBoxContainer( location ) ).serialize();
			}
			return memo;
		}, {} );
		store.dispatch( setMetaBoxSavedData( dataPerLocation ) );

		// Additional data needed for backwards compatibility.
		// If we do not provide this data the post will be overriden with the default values.
		const post = select( 'core/editor' ).getCurrentPost( state );
		const additionalData = [
			post.comment_status && `comment_status=${ post.comment_status }`,
			post.ping_status && `ping_status=${ post.ping_status }`,
			`post_author=${ post.author }`,
		].filter( Boolean );

		// To save the metaboxes, we serialize each one of the location forms and combine them
		// We also add the "common" hidden fields from the base .metabox-base-form
		const formData = values( dataPerLocation )
			.concat( jQuery( '.metabox-base-form' ).serialize() )
			.concat( additionalData )
			.join( '&' );

		// Save the metaboxes
		wp.apiRequest( {
			url: window._wpMetaBoxUrl,
			method: 'POST',
			contentType: 'application/x-www-form-urlencoded',
			data: formData,
		} )
			.then( () => store.dispatch( metaBoxUpdatesSuccess() ) );
	},
	SWITCH_MODE( action ) {
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

		// Collapse sidebar when viewport shrinks.
		subscribe( onChangeListener(
			() => select( 'core/viewport' ).isViewportMatch( '< medium' ),
			( () => {
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
			} )()
		) );
	},

};

export default effects;
