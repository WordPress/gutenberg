import {
	Button,
	Dropdown,
	__experimentalVStack as VStack,
	RadioControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useMemo, useRef, useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import {
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
} from '@wordpress/icons';
import { DESIGN_POST_TYPES } from '../../store/constants';
import PostPanelRow from '../post-panel-row';
import PostSticky from '../post-sticky';
import { PrivatePostSchedule } from '../post-schedule';
import { store as editorStore } from '../../store';
import PostPasswordModal from './post-password-modal';

const postStatusesInfo = {
	'auto-draft': { label: __( 'Draft' ), icon: drafts },
	draft: { label: __( 'Draft' ), icon: drafts },
	pending: { label: __( 'Pending' ), icon: pending },
	private: { label: __( 'Private' ), icon: notAllowed },
	future: { label: __( 'Scheduled' ), icon: scheduled },
	publish: { label: __( 'Published' ), icon: published },
};

export const STATUS_OPTIONS = [
	{
		label: __( 'Draft' ),
		value: 'draft',
		description: __( 'Not ready to publish.' ),
	},
	{
		label: __( 'Pending' ),
		value: 'pending',
		description: __( 'Waiting for review before publishing.' ),
	},
	{
		label: __( 'Private' ),
		value: 'private',
		description: __( 'Only visible to site admins and editors.' ),
	},
	{
		label: __( 'Scheduled' ),
		value: 'future',
		description: __( 'Publish automatically on a chosen date.' ),
	},
	{
		label: __( 'Published' ),
		value: 'publish',
		description: __( 'Visible to everyone.' ),
	},
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
	const [ isPasswordModalOpen, setIsPasswordModalOpen ] = useState( false );
	const wasPasswordModalOpenRef = useRef( false );
	const statusToggleRef = useRef( null );

	useEffect( () => {
		if ( wasPasswordModalOpenRef.current && ! isPasswordModalOpen ) {
			statusToggleRef.current?.focus();
		}
		wasPasswordModalOpenRef.current = isPasswordModalOpen;
	}, [ isPasswordModalOpen ] );

	const { editEntityRecord } = useDispatch( coreStore );
	const passwordHelpId = useInstanceId(
		PostStatus,
		'editor-change-status__password-help'
	);
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

	const handleStatus = ( value ) => {
		let newDate = date;
		let newPassword = password;
		if ( status === 'future' && new Date( date ) > new Date() ) {
			newDate = null;
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
				<>
					<Dropdown
						className="editor-post-status"
						contentClassName="editor-change-status__content"
						popoverProps={ popoverProps }
						focusOnMount
						renderToggle={ ( { onToggle, isOpen } ) => (
							<Button
								ref={ statusToggleRef }
								className="editor-post-status__toggle"
								variant="tertiary"
								size="compact"
								onClick={ onToggle }
								icon={ postStatusesInfo[ status ]?.icon }
								aria-label={ sprintf(
									// translators: %s: Current post status.
									__( 'Change status: %s' ),
									postStatusesInfo[ status ]?.label
								) }
								aria-expanded={ isOpen }
							>
								{ postStatusesInfo[ status ]?.label }
							</Button>
						) }
						renderContent={ ( { onClose } ) => (
							<>
								<InspectorPopoverHeader
									title={ __( 'Status & visibility' ) }
									onClose={ onClose }
								/>
								<form
									onSubmit={ ( event ) => {
										event.preventDefault();
										onClose();
									} }
								>
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
										{ status === 'future' && (
											<div className="editor-change-status__publish-date-wrapper">
												<PrivatePostSchedule
													showPopoverHeaderActions={
														false
													}
													isCompact
												/>
											</div>
										) }
										{ status !== 'private' && (
											<VStack
												as="div"
												spacing={ 2 }
												className="editor-change-status__password-fieldset"
											>
												<Button
													__next40pxDefaultSize
													variant="secondary"
													aria-describedby={
														passwordHelpId
													}
													onClick={ () => {
														onClose();
														setIsPasswordModalOpen(
															true
														);
													} }
												>
													{ password
														? __( 'Edit password' )
														: __( 'Set password' ) }
												</Button>
												<p
													id={ passwordHelpId }
													className="editor-change-status__password-help"
												>
													{ __(
														'Only visible to those who know the password.'
													) }
												</p>
											</VStack>
										) }
										<PostSticky />
									</VStack>
								</form>
							</>
						) }
					/>
					{ isPasswordModalOpen && (
						<PostPasswordModal
							initialPassword={ password }
							onSave={ ( newPassword ) => {
								updatePost( { password: newPassword } );
								setIsPasswordModalOpen( false );
							} }
							onRemove={ () => {
								updatePost( { password: '' } );
								setIsPasswordModalOpen( false );
							} }
							onClose={ () => {
								setIsPasswordModalOpen( false );
							} }
						/>
					) }
				</>
			) : (
				<div className="editor-post-status is-read-only">
					{ postStatusesInfo[ status ]?.label }
				</div>
			) }
		</PostPanelRow>
	);
}
