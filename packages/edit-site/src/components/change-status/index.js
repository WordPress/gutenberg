/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	BaseControl,
	ToggleControl,
	DateTimePicker,
	__experimentalText as Text,
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
		label: __( 'Draft' ),
		value: 'draft',
		hint: __( 'Not ready to publish' ),
	},
	{
		label: __( 'Private' ),
		value: 'private',
		hint: __( 'Published, but only visible to admins and site editors' ),
	},
	{
		label: __( 'Pending' ),
		value: 'pending',
		hint: __( 'Awaiting admin review' ),
	},
	{
		label: __( 'Scheduled' ),
		value: 'future',
		hint: __( 'Publish automatically on a chosen date' ),
	},
	{
		label: __( 'Published' ),
		value: 'publish',
		hint: __( 'Anyone with the url can access' ),
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

			createSuccessNotice(
				__( 'Save your changes for your status to take affect' ),
				{
					type: 'snackbar',
				}
			);
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
						<BaseControl
							hideLabelFromVision
							label={ __( 'Status' ) }
							id={ `edit-site-change-status__status` }
							className={ 'components-radio-control' }
						>
							<VStack spacing={ 3 }>
								{ STATUS_OPTIONS.map( ( option, index ) => (
									<div
										key={ `edit-site-change-status__status-${ index }` }
										className="components-radio-control__option with-hint"
									>
										<input
											id={ `edit-site-change-status__status-${ index }` }
											className="components-radio-control__input"
											type="radio"
											name={ `edit-site-change-status__status` }
											value={ option.value }
											onChange={ ( e ) =>
												setStatus( e.target.value )
											}
											checked={ option.value === status }
										/>
										<VStack spacing={ 1 }>
											<label
												htmlFor={ `edit-site-change-status__status-${ index }` }
											>
												{ option.label }
											</label>
											{ option.hint && (
												<Text variant="muted">
													{ option.hint }
												</Text>
											) }
										</VStack>
									</div>
								) ) }
							</VStack>
						</BaseControl>
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
								label={ __(
									'Hide this page behind a password'
								) }
								checked={ showPassword }
								onChange={ handleTogglePassword }
							/>
							{ showPassword && (
								<TextControl
									onChange={ setPassword }
									value={ password }
									/* eslint-disable jsx-a11y/no-autofocus */
									autoFocus
									/* eslint-enable jsx-a11y/no-autofocus */
									placeholder={ __(
										'Enter a secure password'
									) }
									type="password"
								/>
							) }
						</BaseControl>
					</VStack>
					<HStack
						className="edit-site-change-status__footer"
						alignment="right"
					>
						<Button variant="tertiary" onClick={ closeModal }>
							{ __( 'Cancel' ) }
						</Button>
						<Button variant="primary" onClick={ saveStatus }>
							{ __( 'Done' ) }
						</Button>
					</HStack>
				</Modal>
			) }
		</>
	);
}
