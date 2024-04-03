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
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../utils/constants';

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
		dispatch( {
			type: 'SET_CANVAS_MODE',
			mode,
		} );
		// Check if the block list view should be open by default.
		// If `distractionFree` mode is enabled, the block list view should not be open.
		// This behavior is disabled for small viewports.
		if (
			isMediumOrBigger &&
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
 * @param {Array} items An array of template or template part objects to remove.
 */
export const removeTemplates =
	( items ) =>
	async ( { registry } ) => {
		const isTemplate = items[ 0 ].type === TEMPLATE_POST_TYPE;
		const promiseResult = await Promise.allSettled(
			items.map( ( item ) => {
				return registry
					.dispatch( coreStore )
					.deleteEntityRecord(
						'postType',
						item.type,
						item.id,
						{ force: true },
						{ throwOnError: true }
					);
			} )
		);

		// If all the promises were fulfilled with sucess.
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			let successMessage;

			if ( items.length === 1 ) {
				// Depending on how the entity was retrieved its title might be
				// an object or simple string.
				const title =
					typeof items[ 0 ].title === 'string'
						? items[ 0 ].title
						: items[ 0 ].title?.rendered;
				successMessage = sprintf(
					/* translators: The template/part's name. */
					__( '"%s" deleted.' ),
					decodeEntities( title )
				);
			} else {
				successMessage = isTemplate
					? __( 'Templates deleted.' )
					: __( 'Template parts deleted.' );
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
					errorMessage = isTemplate
						? __( 'An error occurred while deleting the template.' )
						: __(
								'An error occurred while deleting the template part.'
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
					errorMessage = isTemplate
						? __(
								'An error occurred while deleting the templates.'
						  )
						: __(
								'An error occurred while deleting the template parts.'
						  );
				} else if ( errorMessages.size === 1 ) {
					errorMessage = isTemplate
						? sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while deleting the templates: %s'
								),
								[ ...errorMessages ][ 0 ]
						  )
						: sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while deleting the template parts: %s'
								),
								[ ...errorMessages ][ 0 ]
						  );
				} else {
					errorMessage = isTemplate
						? sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while deleting the templates: %s'
								),
								[ ...errorMessages ].join( ',' )
						  )
						: sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while deleting the template parts: %s'
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
