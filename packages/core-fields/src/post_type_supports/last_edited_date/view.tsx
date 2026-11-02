import { Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import type { PostWithModified } from './types';

/*
 * The date a post was last edited.
 */
export default function LastEditedDateView( {
	item,
}: {
	item: PostWithModified;
} ) {
	if ( ! item.modified ) {
		return null;
	}
	return (
		<Text>
			{ sprintf(
				// translators: %s: Human-readable time difference, e.g. "2 days ago".
				__( 'Last edited %s.' ),
				humanTimeDiff( item.modified )
			) }
		</Text>
	);
}
