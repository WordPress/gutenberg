/**
 * WordPress dependencies
 */
import { Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

export default function LastEditedDateView( { item }: { item: BasePost } ) {
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
