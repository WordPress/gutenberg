/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const getFormattedDate = ( dateToDisplay: string | null ) =>
	dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( dateToDisplay )
	);

const DateView = ( { item }: { item: BasePost } ) => {
	const isDraftOrPrivate = [ 'draft', 'private' ].includes(
		item.status ?? ''
	);
	if ( isDraftOrPrivate ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: page creation or modification date. */
				__( '<span>Modified: <time>%s</time></span>' ),
				getFormattedDate( item.date ?? null )
			),
			{
				span: <span />,
				time: <time />,
			}
		);
	}

	const isScheduled = item.status === 'future';
	if ( isScheduled ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: page creation date */
				__( '<span>Scheduled: <time>%s</time></span>' ),
				getFormattedDate( item.date ?? null )
			),
			{
				span: <span />,
				time: <time />,
			}
		);
	}

	const isPublished = item.status === 'publish';
	if ( isPublished ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: page creation time */
				__( '<span>Published: <time>%s</time></span>' ),
				getFormattedDate( item.date ?? null )
			),
			{
				span: <span />,
				time: <time />,
			}
		);
	}

	// Pending posts show the modified date if it's newer.
	const dateToDisplay =
		getDate( item.modified ?? null ) > getDate( item.date ?? null )
			? item.modified
			: item.date;

	const isPending = item.status === 'pending';
	if ( isPending ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: page creation or modification date. */
				__( '<span>Modified: <time>%s</time></span>' ),
				getFormattedDate( dateToDisplay ?? null )
			),
			{
				span: <span />,
				time: <time />,
			}
		);
	}

	// Unknow status.
	return <time>{ getFormattedDate( item.date ?? null ) }</time>;
};

export default DateView;
