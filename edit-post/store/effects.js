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
} from './actions';
import { getMetaBoxes } from './selectors';
import { getMetaBoxContainer } from '../utils/meta-boxes';

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
		let previousIsSaving = select( 'core/editor' ).isSavingPost();
		subscribe( () => {
			const isSavingPost = select( 'core/editor' ).isSavingPost();
			const shouldTriggerSaving = ! isSavingPost && previousIsSaving;
			previousIsSaving = isSavingPost;
			if ( shouldTriggerSaving ) {
				store.dispatch( requestMetaBoxUpdates() );
			}
		} );
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
};

export default effects;
