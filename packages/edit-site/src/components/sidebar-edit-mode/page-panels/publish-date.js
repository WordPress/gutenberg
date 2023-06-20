/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __experimentalPublishDateTimePicker as PublishDateTimePicker } from '@wordpress/block-editor';
import { humanTimeDiff } from '@wordpress/date';

export default function ChangeStatus( { postType, postId, status, date } ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Change publish date' ),
			placement: 'bottom-end',
		} ),
		[ popoverAnchor ]
	);

	const saveDate = async ( newDate ) => {
		try {
			let newStatus = status;
			if ( status === 'future' && new Date( newDate ) < new Date() ) {
				newStatus = 'publish';
			} else if (
				status === 'publish' &&
				new Date( newDate ) > new Date()
			) {
				newStatus = 'future';
			}
			await editEntityRecord( 'postType', postType, postId, {
				status: newStatus,
				date: newDate,
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the status' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	};

	const relateToNow = date ? humanTimeDiff( date ) : __( 'Immediately' );

	return (
		<HStack className="edit-site-summary-field">
			<Text className="edit-site-summary-field__label">
				{ __( 'Publish' ) }
			</Text>
			<Dropdown
				contentClassName="edit-site-change-status__content"
				popoverProps={ popoverProps }
				focusOnMount
				ref={ setPopoverAnchor }
				renderToggle={ ( { onToggle } ) => (
					<Button
						className="edit-site-summary-field__trigger"
						variant="tertiary"
						onClick={ onToggle }
					>
						{ relateToNow }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<PublishDateTimePicker
						currentDate={ date }
						is12Hour
						onClose={ onClose }
						onChange={ saveDate }
					/>
				) }
			/>
		</HStack>
	);
}
