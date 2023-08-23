/**
 * WordPress dependencies
 */
import {
	Button,
	ToggleControl,
	Dropdown,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	TextControl,
	RadioControl,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import StatusLabel from '../../sidebar-navigation-screen-page/status-label';

const STATUS_OPTIONS = [
	{
		label: (
			<>
				{ __( 'Draft' ) }
				<Text variant="muted">{ __( 'Not ready to publish.' ) }</Text>
			</>
		),
		value: 'draft',
	},
	{
		label: (
			<>
				{ __( 'Pending' ) }
				<Text variant="muted">
					{ __( 'Waiting for review before publishing.' ) }
				</Text>
			</>
		),
		value: 'pending',
	},
	{
		label: (
			<>
				{ __( 'Private' ) }
				<Text variant="muted">
					{ __( 'Only visible to site admins and editors.' ) }
				</Text>
			</>
		),
		value: 'private',
	},
	{
		label: (
			<>
				{ __( 'Scheduled' ) }
				<Text variant="muted">
					{ __( 'Publish automatically on a chosen date.' ) }
				</Text>
			</>
		),
		value: 'future',
	},
	{
		label: (
			<>
				{ __( 'Published' ) }
				<Text variant="muted">{ __( 'Visible to everyone.' ) }</Text>
			</>
		),
		value: 'publish',
	},
];

export default function PageStatus( {
	postType,
	postId,
	status,
	password,
	date,
} ) {
	const [ showPassword, setShowPassword ] = useState( !! password );
	const instanceId = useInstanceId( PageStatus );

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Change status' ),
			placement: 'bottom-end',
		} ),
		[ popoverAnchor ]
	);

	const saveStatus = async ( {
		status: newStatus = status,
		password: newPassword = password,
		date: newDate = date,
	} ) => {
		try {
			await editEntityRecord( 'postType', postType, postId, {
				status: newStatus,
				date: newDate,
				password: newPassword,
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

	const handleTogglePassword = ( value ) => {
		setShowPassword( value );
		if ( ! value ) {
			saveStatus( { password: '' } );
		}
	};

	const handleStatus = ( value ) => {
		let newDate = date;
		let newPassword = password;
		if ( value === 'publish' ) {
			if ( new Date( date ) > new Date() ) {
				newDate = null;
			}
		} else if ( value === 'future' ) {
			if ( ! date || new Date( date ) < new Date() ) {
				newDate = new Date();
				newDate.setDate( newDate.getDate() + 7 );
			}
		} else if ( value === 'private' && password ) {
			setShowPassword( false );
			newPassword = '';
		}
		saveStatus( {
			status: value,
			date: newDate,
			password: newPassword,
		} );
	};

	return (
		<HStack className="edit-site-summary-field">
			<Text className="edit-site-summary-field__label">
				{ __( 'Status' ) }
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
						<StatusLabel
							status={ password ? 'protected' : status }
						/>
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<>
						<InspectorPopoverHeader
							title={ __( 'Status' ) }
							onClose={ onClose }
						/>
						<form>
							<VStack spacing={ 5 }>
								<RadioControl
									className="edit-site-change-status__options"
									hideLabelFromVision
									label={ __( 'Status' ) }
									options={ STATUS_OPTIONS }
									onChange={ handleStatus }
									selected={ status }
								/>
								{ status !== 'private' && (
									<fieldset className="edit-site-change-status__password-fieldset">
										<Text
											as="legend"
											className="edit-site-change-status__password-legend"
											size="11"
											lineHeight={ 1.4 }
											weight={ 500 }
											upperCase={ true }
										>
											{ __( 'Password' ) }
										</Text>
										<ToggleControl
											label={ __(
												'Hide this page behind a password'
											) }
											checked={ showPassword }
											onChange={ handleTogglePassword }
										/>
										{ showPassword && (
											<div className="edit-site-change-status__password-input">
												<VisuallyHidden
													as="label"
													htmlFor={ `edit-site-change-status__password-input-${ instanceId }` }
												>
													{ __( 'Create password' ) }
												</VisuallyHidden>
												<TextControl
													onChange={ ( value ) =>
														saveStatus( {
															password: value,
														} )
													}
													value={ password }
													placeholder={ __(
														'Use a secure password'
													) }
													type="text"
													id={ `edit-site-change-status__password-input-${ instanceId }` }
												/>
											</div>
										) }
									</fieldset>
								) }
							</VStack>
						</form>
					</>
				) }
			/>
		</HStack>
	);
}
