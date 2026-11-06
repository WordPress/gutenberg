import { getDate, isInTheFuture } from '@wordpress/date';

/**
 * Whether saving a post with this date publishes it rather than schedules it.
 * Like the editor, a date less than a minute ahead counts as now, which covers
 * the time the save takes.
 *
 * @param date The post date.
 * @return Whether the post publishes when it is saved.
 */
export function isPublishedOnSave( date: string ): boolean {
	return ! isInTheFuture( new Date( Number( getDate( date ) ) - 60 * 1000 ) );
}
