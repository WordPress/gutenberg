/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Action } from '@wordpress/dataviews';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { Post, CoreDataError } from '../types';

const resetTemplate: Action< Post > = {
	id: 'reset-template',
	label: __( 'Reset template' ),
	isEligible( post ) {
		if ( post.type !== 'page' ) {
			return false;
		}

		if ( ! ( 'template' in post ) ) {
			return false;
		}

		// Only show if the page has a custom template set.
		// Default template is indicated by an empty string.
		const template = post.template;
		return typeof template === 'string' && template !== '';
	},
	async callback( posts, { registry, onActionPerformed } ) {
		const post = posts[ 0 ];
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );

		try {
			// Set template to empty string to use default template.
			editEntityRecord( 'postType', 'page', post.id, {
				template: '',
			} );
			await saveEditedEntityRecord( 'postType', 'page', post.id, {
				throwOnError: true,
			} );

			createSuccessNotice( __( 'Template reset to default.' ), {
				type: 'snackbar',
			} );

			if ( onActionPerformed ) {
				onActionPerformed( posts );
			}
		} catch ( error ) {
			const typedError = error as CoreDataError;
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
					: __( 'An error occurred while resetting the template.' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	},
};

/**
 * Reset template action for Post.
 */
export default resetTemplate;
