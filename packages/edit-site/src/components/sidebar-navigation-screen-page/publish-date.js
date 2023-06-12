/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { createInterpolateElement, useState } from '@wordpress/element';
import { DateTimePicker, Button, Dropdown } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function StatusLabel( { date: currentDate, postId, postType } ) {
	const [ date, setDate ] = useState( currentDate );

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function saveDate( newDate ) {
		setDate( newDate );
		try {
			await editEntityRecord( 'postType', postType, postId, {
				date: newDate,
			} );
		} catch ( error ) {
			setDate( currentDate );
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the status' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}

	const formattedDate = dateI18n(
		getSettings().formats.date,
		getDate( date )
	);

	const statusLabel = createInterpolateElement(
		sprintf(
			/* translators: %s: is the formatted date and time on which the post is scheduled to be published. */
			__( '<time>%s</time>' ),
			formattedDate
		),
		{ time: <time dateTime={ date } /> }
	);

	return (
		<div className="edit-site-sidebar-navigation-screen-page__status">
			<Dropdown
				className="my-container-class-name"
				contentClassName="my-dropdown-content-classname"
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						variant="primary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						{ statusLabel }
					</Button>
				) }
				renderContent={ () => (
					<DateTimePicker
						currentDate={ date }
						onChange={ saveDate }
					/>
				) }
			/>
		</div>
	);
}
