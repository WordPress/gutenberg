/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	ToggleControl,
	Dropdown,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	TextControl,
	RadioControl,
	VisuallyHidden,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useState,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate, humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

export function PostStatusLabel( { status, date, short } ) {
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
			className={ classnames(
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

export default function PostStatus() {
	const { status, date, password, postId, postType } = useSelect(
		( select ) => {
			const {
				getEditedPostAttribute,
				getCurrentPostId,
				getCurrentPostType,
			} = select( editorStore );
			return {
				status: getEditedPostAttribute( 'status' ),
				date: getEditedPostAttribute( 'date' ),
				password: getEditedPostAttribute( 'password' ),
				postId: getCurrentPostId(),
				postType: getCurrentPostType(),
			};
		},
		[]
	);
	const [ showPassword, setShowPassword ] = useState( !! password );
	const passwordInputId = useInstanceId(
		PostStatus,
		'editor-change-status__password-input'
	);
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
		<PostPanelRow label={ __( 'Status' ) }>
			<Dropdown
				contentClassName="editor-change-status__content"
				popoverProps={ popoverProps }
				focusOnMount
				ref={ setPopoverAnchor }
				renderToggle={ ( { onToggle } ) => (
					<Button
						className="editor-summary-field__trigger"
						variant="tertiary"
						onClick={ onToggle }
					>
						<PostStatusLabel
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
									className="editor-change-status__options"
									hideLabelFromVision
									label={ __( 'Status' ) }
									options={ STATUS_OPTIONS }
									onChange={ handleStatus }
									selected={ status }
								/>
								{ status !== 'private' && (
									<fieldset>
										<Text
											as="legend"
											className="editor-change-status__password-legend"
											size="11"
											lineHeight={ 1.4 }
											weight={ 500 }
											upperCase
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
											<div>
												<VisuallyHidden
													as="label"
													htmlFor={ passwordInputId }
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
													id={ passwordInputId }
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
		</PostPanelRow>
	);
}
