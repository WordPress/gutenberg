/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createStatusAction } from '../../utils/actions';
import { POST_TYPE_ENTITY } from '../../constants';
import type { PostTypeFormData } from '../types';

const deactivateAction = createStatusAction< PostTypeFormData >( {
	id: 'deactivate',
	label: __( 'Deactivate' ),
	entity: POST_TYPE_ENTITY,
	targetStatus: 'draft',
	messages: {
		successSingle: __( 'Post type deactivated.' ),
		successMany: ( count: number ) =>
			sprintf(
				/* translators: %d: The number of post types. */
				_n(
					'%d post type deactivated.',
					'%d post types deactivated.',
					count
				),
				count
			),
		failSingle: __( 'Failed to deactivate post type.' ),
		failMany: __( 'Failed to deactivate post types.' ),
		errorSingle: ( message: string ) =>
			sprintf(
				/* translators: %s: an error message */
				__( 'An error occurred while deactivating the post type: %s' ),
				message
			),
		errorMany: ( messages: string ) =>
			sprintf(
				/* translators: %s: a list of comma separated error messages */
				__(
					'Some errors occurred while deactivating the post types: %s'
				),
				messages
			),
	},
} );

export default deactivateAction;
