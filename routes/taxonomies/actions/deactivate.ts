/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createStatusAction } from './utils';

const deactivateAction = createStatusAction( {
	id: 'deactivate',
	label: __( 'Deactivate' ),
	targetStatus: 'draft',
	messages: {
		successSingle: __( 'Taxonomy deactivated.' ),
		successMany: ( count: number ) =>
			sprintf(
				/* translators: %d: The number of taxonomies. */
				_n(
					'%d taxonomy deactivated.',
					'%d taxonomies deactivated.',
					count
				),
				count
			),
		failSingle: __( 'Failed to deactivate taxonomy.' ),
		failMany: __( 'Failed to deactivate taxonomies.' ),
		errorSingle: ( message: string ) =>
			sprintf(
				/* translators: %s: an error message */
				__( 'An error occurred while deactivating the taxonomy: %s' ),
				message
			),
		errorMany: ( messages: string ) =>
			sprintf(
				/* translators: %s: a list of comma separated error messages */
				__(
					'Some errors occurred while deactivating the taxonomies: %s'
				),
				messages
			),
	},
} );

export default deactivateAction;
