/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createStatusAction } from '../../utils/actions';
import { TAXONOMY_ENTITY } from '../../constants';
import type { TaxonomyFormData } from '../types';

const activateAction = createStatusAction< TaxonomyFormData >( {
	id: 'activate',
	label: __( 'Activate' ),
	entity: TAXONOMY_ENTITY,
	targetStatus: 'publish',
	messages: {
		successSingle: __( 'Taxonomy activated.' ),
		successMany: ( count: number ) =>
			sprintf(
				/* translators: %d: The number of taxonomies. */
				_n(
					'%d taxonomy activated.',
					'%d taxonomies activated.',
					count
				),
				count
			),
		failSingle: __( 'Failed to activate taxonomy.' ),
		failMany: __( 'Failed to activate taxonomies.' ),
		errorSingle: ( message: string ) =>
			sprintf(
				/* translators: %s: an error message */
				__( 'An error occurred while activating the taxonomy: %s' ),
				message
			),
		errorMany: ( messages: string ) =>
			sprintf(
				/* translators: %s: a list of comma separated error messages */
				__(
					'Some errors occurred while activating the taxonomies: %s'
				),
				messages
			),
	},
} );

export default activateAction;
