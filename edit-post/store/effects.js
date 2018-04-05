/**
 * External dependencies
 */
import { reduce, some } from 'lodash';

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
		window.postboxes.add_postbox_toggles( select( 'core/editor' ).getCurrentPostType() );

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
			post.comment_status ? [ 'comment_status', post.comment_status ] : false,
			post.ping_status ? [ 'ping_status', post.ping_status ] : false,
			[ 'post_author', post.author ],
		].filter( Boolean );

		// We gather all the metaboxes locations data and the base form data
		const baseFormData = new window.FormData( document.querySelector( '.metabox-base-form' ) );
		const formDataToMerge = reduce( getMetaBoxes( state ), ( memo, metabox, location ) => {
			if ( metabox.isActive ) {
				memo.push( new window.FormData( getMetaBoxContainer( location ) ) );
			}
			return memo;
		}, [ baseFormData ] );

		// Merge all form data objects into a single one.
		const formData = reduce( formDataToMerge, ( memo, currentFormData ) => {
			for ( const [ key, value ] of currentFormData ) {
				memo.append( key, value );
			}
			return memo;
		}, new window.FormData() );
		additionalData.forEach( ( [ key, value ] ) => formData.append( key, value ) );

		// Save the metaboxes
		wp.apiRequest( {
			url: window._wpMetaBoxUrl,
			method: 'POST',
			processData: false,
			contentType: false,
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
