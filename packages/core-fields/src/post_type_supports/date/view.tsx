import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { PostWithDate } from './types';

const getFormattedDate = ( dateToDisplay: string | null ) =>
	dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( dateToDisplay )
	);

/*
 * The date of a post, worded after its status.
 */
const DateView = ( { item }: { item: PostWithDate } ) => {
	const isDraftOrPrivate = [ 'draft', 'private' ].includes(
		item.status ?? ''
	);
	if ( isDraftOrPrivate ) {
		return (
			<span>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: page creation or modification date. */
						__( 'Modified: <time>%s</time>' ),
						getFormattedDate( item.date ?? null )
					),
					{
						time: <time />,
					}
				) }
			</span>
		);
	}

	const isScheduled = item.status === 'future';
	if ( isScheduled ) {
		return (
			<span>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: page creation date */
						__( 'Scheduled: <time>%s</time>' ),
						getFormattedDate( item.date ?? null )
					),
					{
						time: <time />,
					}
				) }
			</span>
		);
	}

	const isPublished = item.status === 'publish';
	if ( isPublished ) {
		return (
			<span>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: page creation time */
						__( 'Published: <time>%s</time>' ),
						getFormattedDate( item.date ?? null )
					),
					{
						time: <time />,
					}
				) }
			</span>
		);
	}

	// Pending posts show the modified date if it's newer.
	const dateToDisplay =
		getDate( item.modified ?? null ) > getDate( item.date ?? null )
			? item.modified
			: item.date;

	const isPending = item.status === 'pending';
	if ( isPending ) {
		return (
			<span>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: page creation or modification date. */
						__( 'Modified: <time>%s</time>' ),
						getFormattedDate( dateToDisplay ?? null )
					),
					{
						time: <time />,
					}
				) }
			</span>
		);
	}

	// Unknown status.
	return <time>{ getFormattedDate( item.date ?? null ) }</time>;
};

export default DateView;
