/**
 * External dependencies
 */
import { reduce, values, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { select, subscribe } from '@wordpress/data';

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

		// Allow toggling metaboxes panels
		if ( hasActiveMetaBoxes ) {
			window.postboxes.add_postbox_toggles( 'post' );
		}

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
};

export default effects;
