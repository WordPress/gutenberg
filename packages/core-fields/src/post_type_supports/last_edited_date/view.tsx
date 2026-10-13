import { Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import type { PostWithModified } from './types';

/*
 * A copy of the last edited date view of `@wordpress/fields`.
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
