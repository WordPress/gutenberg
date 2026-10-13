import { __ } from '@wordpress/i18n';
import type { FieldsScriptParts } from '@wordpress/fields-loader';

interface PostWithDiscussion {
	comment_status?: 'open' | 'closed';
	ping_status?: 'open' | 'closed';
}

/**
 * The JavaScript parts of the discussion field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithDiscussion >[ string ] =
	{
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
	};
