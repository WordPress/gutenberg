import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';

const discussionField: Field< BasePost > = {
	id: 'discussion',
	label: __( 'Discussion' ),
	type: 'text',
	render: ( { item } ) => {
		// The four combined values below each state something about both
		// settings, so they can only be used when both are known. Bulk editing
		// starts out knowing neither and can end up knowing just one, and
		// reporting e.g. "Comments only" there would claim pings are closed for
		// posts whose ping setting is not being touched at all.
		const knowsComments = item.comment_status !== undefined;
		const knowsPings = item.ping_status !== undefined;
		const commentsOpen = item.comment_status === 'open';
		const pingsOpen = item.ping_status === 'open';

		if ( ! knowsComments && ! knowsPings ) {
			return null;
		}

		if ( ! knowsPings ) {
			return commentsOpen
				? __( 'Comments open' )
				: __( 'Comments closed' );
		}

		if ( ! knowsComments ) {
			return pingsOpen ? __( 'Pings open' ) : __( 'Pings closed' );
		}

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
