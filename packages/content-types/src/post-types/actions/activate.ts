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

const activateAction = createStatusAction< PostTypeFormData >( {
	id: 'activate',
	label: __( 'Activate' ),
	entity: POST_TYPE_ENTITY,
	targetStatus: 'publish',
	messages: {
		successSingle: __( 'Post type activated.' ),
		successMany: ( count: number ) =>
			sprintf(
				/* translators: %d: The number of post types. */
				_n(
					'%d post type activated.',
					'%d post types activated.',
					count
				),
				count
			),
		failSingle: __( 'Failed to activate post type.' ),
		failMany: __( 'Failed to activate post types.' ),
		errorSingle: ( message: string ) =>
			sprintf(
				/* translators: %s: an error message */
				__( 'An error occurred while activating the post type: %s' ),
				message
			),
		errorMany: ( messages: string ) =>
			sprintf(
				/* translators: %s: a list of comma separated error messages */
				__(
					'Some errors occurred while activating the post types: %s'
				),
				messages
			),
	},
} );

export default activateAction;
