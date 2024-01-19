/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Action that switches the canvas mode.
 *
 * @param {?string} mode Canvas mode.
 */
export const setCanvasMode =
	( mode ) =>
	( { registry, dispatch } ) => {
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

/**
 * Action that removes an array of templates.
 *
 * @param {Array} templates An array of template objects to remove.
 */
export const removeTemplates =
	( templates ) =>
	async ( { registry } ) => {
		const promiseResult = await Promise.allSettled(
			templates.map( ( template ) => {
				return registry
					.dispatch( coreStore )
					.deleteEntityRecord(
						'postType',
						template.type,
						template.id,
						{ force: true },
						{ throwOnError: true }
					);
			} )
		);

		// If all the promises were fulfilled with sucess.
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			let successMessage;

			if ( templates.length === 1 ) {
				// Depending on how the entity was retrieved its title might be
				// an object or simple string.
				const templateTitle =
					typeof templates[ 0 ].title === 'string'
						? templates[ 0 ].title
						: templates[ 0 ].title?.rendered;
				successMessage = sprintf(
					/* translators: The template/part's name. */
					__( '"%s" deleted.' ),
					decodeEntities( templateTitle )
				);
			} else {
				successMessage = __( 'Templates deleted.' );
			}

			registry
				.dispatch( noticesStore )
				.createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: 'site-editor-template-deleted-success',
				} );
		} else {
			// If there was at lease one failure.
			let errorMessage;
			// If we were trying to delete a single template.
			if ( promiseResult.length === 1 ) {
				if ( promiseResult[ 0 ].reason?.message ) {
					errorMessage = promiseResult[ 0 ].reason.message;
				} else {
					errorMessage = __(
						'An error occurred while deleting the template.'
					);
				}
				// If we were trying to delete a multiple templates
			} else {
				const errorMessages = new Set();
				const failedPromises = promiseResult.filter(
					( { status } ) => status === 'rejected'
				);
				for ( const failedPromise of failedPromises ) {
					if ( failedPromise.reason?.message ) {
						errorMessages.add( failedPromise.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __(
						'An error occurred while deleting the templates.'
					);
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while deleting the templates: %s'
						),
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while deleting the templates: %s'
						),
						[ ...errorMessages ].join( ',' )
					);
				}
			}
			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};
