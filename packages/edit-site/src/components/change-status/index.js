/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	BaseControl,
	CustomSelectControl,
	ToggleControl,
	DateTimePicker,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

const STATUS_OPTIONS = [
	{
		name: __( 'Published' ),
		value: 'publish',
		key: 'publish',
	},
	{
		name: __( 'Draft' ),
		value: 'draft',
		key: 'draft',
	},
	{
		name: __( 'Pending' ),
		value: 'pending',
		key: 'pending',
		__experimentalHint: __( 'Awaiting admin review' ),
	},
	{
		name: __( 'Private' ),
		value: 'private',
		key: 'private',
		__experimentalHint: __(
			'Published, but only visible to admins and site editors'
		),
	},
	{
		name: __( 'Scheduled' ),
		value: 'future',
		key: 'future',
		__experimentalHint: __( 'Publish automatically on a chosen date' ),
	},
];

export default function ChangeStatus( { post } ) {
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ status, setStatus ] = useState( post.status );
	const [ date, setDate ] = useState( post.date );
	const [ showPassword, setShowPassword ] = useState( !! post.password );
	const [ password, setPassword ] = useState( post.password );
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	async function saveStatus( event ) {
		event.preventDefault();

		if ( isCreatingPage ) {
			return;
		}
		setIsCreatingPage( true );
		try {
			await editEntityRecord( 'postType', post.type, post.id, {
				status,
				date,
				password,
			} );

			createSuccessNotice( __( 'Updated status successfully' ), {
				type: 'snackbar',
			} );
			setOpen( false );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the status' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			setIsCreatingPage( false );
		}
	}

	const handleTogglePassword = ( value ) => {
		setShowPassword( value );
		if ( ! value ) {
			setPassword( '' );
		}
	};

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Change status
			</Button>
			{ isOpen && (
				<Modal
					title="Update status"
					onRequestClose={ closeModal }
					className="edit-site-change-status"
				>
					<VStack
						className="edit-site-change-status__content"
						spacing={ 5 }
					>
						<CustomSelectControl
							value={
								STATUS_OPTIONS.find(
									( option ) => option.value === status
								) || STATUS_OPTIONS[ 0 ]
							}
							label={ __( 'Status' ) }
							options={ STATUS_OPTIONS }
							onChange={ ( { selectedItem } ) => {
								setStatus( selectedItem.value );
							} }
						/>
						{ status === 'future' && (
							<div className="edit-site-change-status__date-time-picker">
								<DateTimePicker
									className="components-datetime__time__one-row"
									currentDate={ date }
									onChange={ setDate }
								/>
							</div>
						) }
						<BaseControl
							id={ `edit-site-change-status__password` }
							label={ __( 'Password' ) }
						>
							<ToggleControl
								label={ __( 'Hide behind a password' ) }
								checked={ showPassword }
								onChange={ handleTogglePassword }
							/>
							{ showPassword && (
								<TextControl
									onChange={ setPassword }
									value={ password }
									placeholder={ __( 'Enter your password' ) }
									type="password"
									help={ __(
										'Anyone with the password will be able to access this page'
									) }
								/>
							) }
						</BaseControl>
					</VStack>
					<HStack
						className="edit-site-change-status__footer"
						alignment="right"
					>
						<Button variant="tertiary" onClick={ closeModal }>
							Cancel
						</Button>
						<Button variant="primary" onClick={ saveStatus }>
							Done
						</Button>
					</HStack>
				</Modal>
			) }
		</>
	);
}
