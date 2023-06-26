/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate, humanTimeDiff } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { Path, SVG } from '@wordpress/primitives';

const publishedIcon = (
	<SVG fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm-1.067-5.6 4.2-5.667.8.6-4.8 6.467-3-2.267.6-.8 2.2 1.667Z"
		/>
	</SVG>
);

const draftIcon = (
	<SVG fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M14.5 8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-8 4a4 4 0 0 0 0-8v8Z"
		/>
	</SVG>
);

const pendingIcon = (
	<SVG fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M14.5 8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0ZM8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
		/>
	</SVG>
);

export default function StatusLabel( { status, date, short } ) {
	const relateToNow = humanTimeDiff( date );
	let statusLabel = '';
	let statusIcon = pendingIcon;
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
			statusIcon = publishedIcon;
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
			statusIcon = draftIcon;
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
			className={ classnames(
				'edit-site-sidebar-navigation-screen-page__status',
				{
					[ `has-status has-${ status }-status` ]: !! status,
				}
			) }
		>
			{ statusIcon } { statusLabel }
		</div>
	);
}
