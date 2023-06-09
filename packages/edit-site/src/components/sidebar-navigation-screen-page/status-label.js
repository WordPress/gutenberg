/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function StatusLabel( {
	status: currentStatus,
	postId,
	postType,
} ) {
	const [ status, setStatus ] = useState( currentStatus );

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function saveStatus( newStatus ) {
		setStatus( newStatus );
		try {
			await editEntityRecord( 'postType', postType, postId, {
				status,
			} );
		} catch ( error ) {
			setStatus( currentStatus );
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the status' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
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
			<SelectControl
				onChange={ saveStatus }
				value={ status }
				options={ [
					{
						label: 'Published',
						value: 'publish',
					},
					{
						label: 'Draft',
						value: 'draft',
					},
					{
						label: 'Scheduled',
						value: 'future',
					},
					{
						label: 'Pending',
						value: 'pending',
					},
				] }
			/>
		</div>
	);
}
