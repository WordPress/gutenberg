/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const discussionField: Field< BasePost > = {
	id: 'discussion',
	label: __( 'Discussion' ),
	type: 'text',
	render: ( { item } ) => {
		const commentsOpen = item.comment_status === 'open';
		const pingsOpen = item.ping_status === 'open';

		if ( commentsOpen && pingsOpen ) {
			return __( 'Open' );
		}
		if ( commentsOpen && ! pingsOpen ) {
			return __( 'Comments only' );
		}
		if ( ! commentsOpen && pingsOpen ) {
			return __( 'Pings only' );
		}
		return __( 'Closed' );
	},
	filterBy: false,
};

/**
 * Discussion field for BasePost with custom render logic.
 */
export default discussionField;
