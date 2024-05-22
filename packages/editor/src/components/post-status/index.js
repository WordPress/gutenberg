/**
 * WordPress dependencies
 */
import {
	Button,
	CheckboxControl,
	Dropdown,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	TextControl,
	RadioControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../../store/constants';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

const labels = {
	'auto-draft': __( 'Draft' ),
	draft: __( 'Draft' ),
	pending: __( 'Pending' ),
	private: __( 'Private' ),
	future: __( 'Scheduled' ),
	publish: __( 'Published' ),
};

const STATUS_OPTIONS = [
	{
		label: (
			<>
				{ __( 'Draft' ) }
				<Text variant="muted" size={ 12 }>
					{ __( 'Not ready to publish.' ) }
				</Text>
			</>
		),
		value: 'draft',
	},
	{
		label: (
			<>
				{ __( 'Pending' ) }
				<Text variant="muted" size={ 12 }>
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
				<Text variant="muted" size={ 12 }>
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
				<Text variant="muted" size={ 12 }>
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
				<Text variant="muted" size={ 12 }>
					{ __( 'Visible to everyone.' ) }
				</Text>
			</>
		),
		value: 'publish',
	},
];

const DESIGN_POST_TYPES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
];

export default function PostStatus() {
	const { status, date, password, postId, postType, canEdit } = useSelect(
		( select ) => {
			const {
				getEditedPostAttribute,
				getCurrentPostId,
				getCurrentPostType,
				getCurrentPost,
			} = select( editorStore );
			return {
				status: getEditedPostAttribute( 'status' ),
				date: getEditedPostAttribute( 'date' ),
				password: getEditedPostAttribute( 'password' ),
				postId: getCurrentPostId(),
				postType: getCurrentPostType(),
				canEdit:
					getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
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
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Status & visibility' ),
			headerTitle: __( 'Status & visibility' ),
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	if ( DESIGN_POST_TYPES.includes( postType ) ) {
		return null;
	}

	const updatePost = ( {
		status: newStatus = status,
		password: newPassword = password,
		date: newDate = date,
	} ) => {
		editEntityRecord( 'postType', postType, postId, {
			status: newStatus,
			date: newDate,
			password: newPassword,
		} );
	};

	const handleTogglePassword = ( value ) => {
		setShowPassword( value );
		if ( ! value ) {
			updatePost( { password: '' } );
		}
	};

	const handleStatus = ( value ) => {
		let newDate = date;
		let newPassword = password;
		if ( status === 'future' && new Date( date ) > new Date() ) {
			newDate = null;
		} else if ( value === 'future' ) {
			if ( ! date || new Date( date ) < new Date() ) {
				newDate = new Date();
				newDate.setDate( newDate.getDate() + 7 );
			}
		}
		if ( value === 'private' && password ) {
			newPassword = '';
		}
		updatePost( {
			status: value,
			date: newDate,
			password: newPassword,
		} );
	};

	return (
		<PostPanelRow label={ __( 'Status' ) } ref={ setPopoverAnchor }>
			{ canEdit ? (
				<Dropdown
					className="editor-post-status"
					contentClassName="editor-change-status__content"
					popoverProps={ popoverProps }
					focusOnMount
					renderToggle={ ( { onToggle } ) => (
						<Button
							variant="tertiary"
							size="compact"
							onClick={ onToggle }
							aria-label={ sprintf(
								// translators: %s: Current post status.
								__( 'Change post status: %s' ),
								labels[ status ]
							) }
						>
							{ labels[ status ] }
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<>
							<InspectorPopoverHeader
								title={ __( 'Status & visibility' ) }
								onClose={ onClose }
							/>
							<form>
								<VStack spacing={ 4 }>
									<RadioControl
										className="editor-change-status__options"
										hideLabelFromVision
										label={ __( 'Status' ) }
										options={ STATUS_OPTIONS }
										onChange={ handleStatus }
										selected={
											status === 'auto-draft'
												? 'draft'
												: status
										}
									/>
									{ status !== 'private' && (
										<VStack
											as="fieldset"
											spacing={ 4 }
											className="editor-change-status__password-fieldset"
										>
											<CheckboxControl
												__nextHasNoMarginBottom
												label={ __(
													'Password protected'
												) }
												help={ __(
													'Only visible to those who know the password'
												) }
												checked={ showPassword }
												onChange={
													handleTogglePassword
												}
											/>
											{ showPassword && (
												<div className="editor-change-status__password-input">
													<TextControl
														label={ __(
															'Password'
														) }
														onChange={ ( value ) =>
															updatePost( {
																password: value,
															} )
														}
														value={ password }
														placeholder={ __(
															'Use a secure password'
														) }
														type="text"
														id={ passwordInputId }
														__next40pxDefaultSize
														__nextHasNoMarginBottom
													/>
												</div>
											) }
										</VStack>
									) }
								</VStack>
							</form>
						</>
					) }
				/>
			) : (
				<div className="editor-post-status is-read-only">
					{ labels[ status ] }
				</div>
			) }
		</PostPanelRow>
	);
}
