import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';

const discussionField: Field< BasePost > = {
	id: 'discussion',
	label: __( 'Discussion' ),
	type: 'text',
	render: ( { item } ) => {
		// Neither status is known, so there is nothing to report. Falling
		// through would claim "Closed" for a post whose discussion settings
		// simply haven't been loaded.
		if (
			item.comment_status === undefined &&
			item.ping_status === undefined
		) {
			return null;
		}

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
