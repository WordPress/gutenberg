/**
 * WordPress dependencies
 */
import {
	Button,
	BaseControl,
	ToggleControl,
	Dropdown,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState, useMemo, useId } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import StatusLabel from '../../sidebar-navigation-screen-page/status-label';

const STATUS_OPTIONS = [
	{
		label: __( 'Draft' ),
		value: 'draft',
		hint: __( 'Not ready to publish.' ),
	},
	{
		label: __( 'Pending' ),
		value: 'pending',
		hint: __( 'Waiting for review before publishing.' ),
	},
	{
		label: __( 'Private' ),
		value: 'private',
		hint: __( 'Only visible to site admins and editors.' ),
	},
	{
		label: __( 'Scheduled' ),
		value: 'future',
		hint: __( 'Publish automatically on a chosen date.' ),
	},
	{
		label: __( 'Published' ),
		value: 'publish',
		hint: __( 'Visible to everyone.' ),
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

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			ariaLabel: __( 'Change status' ),
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
		if ( value === 'publish' ) {
			if ( new Date( date ) > new Date() ) {
				newDate = null;
			}
		} else if ( value === 'future' ) {
			if ( ! date || new Date( date ) < new Date() ) {
				newDate = new Date();
				newDate.setDate( newDate.getDate() + 7 );
			}
		}
		saveStatus( {
			status: value,
			date: newDate,
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
						<VStack spacing={ 5 }>
							<BaseControl
								hideLabelFromVision
								label={ __( 'Status' ) }
								id={ `edit-site-change-status__status` }
								className={ 'components-radio-control' }
							>
								<VStack spacing={ 3 }>
									{ STATUS_OPTIONS.map( ( option ) => (
										<RadioWithHelp
											key={ option.value }
											option={ option }
											checked={ option.value === status }
											onChange={ handleStatus }
										/>
									) ) }
								</VStack>
							</BaseControl>
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
										onChange={ ( value ) =>
											saveStatus( { password: value } )
										}
										value={ password }
										/* eslint-disable jsx-a11y/no-autofocus */
										autoFocus={ ! password }
										/* eslint-enable jsx-a11y/no-autofocus */
										placeholder={ __(
											'Enter a secure password'
										) }
										type="password"
									/>
								) }
							</BaseControl>
						</VStack>
					</>
				) }
			/>
		</HStack>
	);
}

const RadioWithHelp = ( { option, onChange, checked } ) => {
	const id = useId();

	return (
		<div
			key={ option.value }
			className="components-radio-control__option with-hint"
		>
			<input
				id={ `${ id }-${ option.value }` }
				className="components-radio-control__input"
				type="radio"
				name={ `edit-site-change-status__status` }
				value={ option.value }
				onChange={ ( e ) => onChange( e.target.value ) }
				checked={ checked }
			/>
			<VStack spacing={ 1 }>
				<label htmlFor={ `${ id }-${ option.value }` }>
					{ option.label }
				</label>
				{ option.hint && <Text variant="muted">{ option.hint }</Text> }
			</VStack>
		</div>
	);
};
