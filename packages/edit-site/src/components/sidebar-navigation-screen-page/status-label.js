/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate, humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';

export default function StatusLabel( { status, date, short } ) {
	const relateToNow = humanTimeDiff( date );
	let statusLabel = status;
	switch ( status ) {
		case 'publish':
			statusLabel = date
				? createInterpolateElement(
						sprintf(
							/* translators: %s: is the relative time when the post was published. */
							__( 'Published <time>%s</time>' ),
							relateToNow
						),
						{ time: <time dateTime={ date } /> }
				  )
				: __( 'Published' );
			break;
		case 'future':
			const formattedDate = dateI18n(
				short ? 'M j' : 'F j',
				getDate( date )
			);
			statusLabel = date
				? createInterpolateElement(
						sprintf(
							/* translators: %s: is the formatted date and time on which the post is scheduled to be published. */
							__( 'Scheduled: <time>%s</time>' ),
							formattedDate
						),
						{ time: <time dateTime={ date } /> }
				  )
				: __( 'Scheduled' );
			break;
		case 'draft':
			statusLabel = __( 'Draft' );
			break;
		case 'pending':
			statusLabel = __( 'Pending' );
			break;
		case 'private':
			statusLabel = __( 'Private' );
			break;
		case 'protected':
			statusLabel = __( 'Password protected' );
			break;
	}

	return (
		<div
			className={ clsx(
				'edit-site-sidebar-navigation-screen-page__status',
				{
					[ `has-status has-${ status }-status` ]: !! status,
				}
			) }
		>
			{ statusLabel }
		</div>
	);
}
