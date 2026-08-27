import {
	Button,
	CheckboxControl,
	Dropdown,
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
	const { status, date, password, postId, postType, canEdit, postStatuses } =
		useSelect( ( select ) => {
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
				postStatuses: select( coreStore ).getEntityRecords(
					'root',
					'status'
				),
			};
		}, [] );
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

	const statusOptions = useMemo( () => {
		if ( ! postStatuses?.length ) {
			return STATUS_OPTIONS;
		}

		const staticOptionsBySlug = new Map(
			STATUS_OPTIONS.map( ( option ) => [ option.value, option ] )
		);

		const options = STATUS_OPTIONS.map( ( option ) => {
			const apiStatus = postStatuses.find(
				( s ) => s.slug === option.value
			);
			if ( apiStatus ) {
				return {
					...option,
					label: apiStatus.name || option.label,
					description: apiStatus.description || option.description,
				};
			}
			return option;
		} );

		postStatuses.forEach( ( apiStatus ) => {
			if (
				! staticOptionsBySlug.has( apiStatus.slug ) &&
				apiStatus.slug !== 'trash' &&
				apiStatus.slug !== 'auto-draft' &&
				apiStatus.slug !== 'inherit' &&
				( apiStatus.show_in_admin_status_list ??
					apiStatus.show_in_list )
			) {
				options.push( {
					label: apiStatus.name,
					value: apiStatus.slug,
					description: apiStatus.description || '',
				} );
			}
		} );

		return options;
	}, [ postStatuses ] );

	const currentStatusInfo = useMemo( () => {
		if ( postStatusesInfo[ status ] ) {
			const info = postStatusesInfo[ status ];
			const apiStatus = postStatuses?.find?.(
				( s ) => s.slug === status
			);
			if ( apiStatus?.name ) {
				return {
					...info,
					label: apiStatus.name,
				};
			}
			return info;
		}
		const matchingStatus = postStatuses?.find?.(
			( s ) => s.slug === status
		);
		if ( matchingStatus ) {
			return {
				label: matchingStatus.name,
				icon: undefined,
			};
		}
		return {
			label: status,
			icon: undefined,
		};
	}, [ status, postStatuses ] );

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
					renderToggle={ ( { onToggle, isOpen } ) => (
						<Button
							className="editor-post-status__toggle"
							variant="tertiary"
							size="compact"
							onClick={ onToggle }
							icon={ currentStatusInfo?.icon }
							aria-label={ sprintf(
								// translators: %s: Current post status.
								__( 'Change status: %s' ),
								currentStatusInfo?.label
							) }
							aria-expanded={ isOpen }
						>
							{ currentStatusInfo?.label }
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
										options={ statusOptions }
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
											as="fieldset"
											spacing={ 4 }
											className="editor-change-status__password-fieldset"
										>
											<CheckboxControl
												label={ __(
													'Password protected'
												) }
												help={ __(
													'Only visible to those who know the password.'
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
														maxLength={ 255 }
													/>
												</div>
											) }
										</VStack>
									) }
									<PostSticky />
								</VStack>
							</form>
						</>
					) }
				/>
			) : (
				<div className="editor-post-status is-read-only">
					{ currentStatusInfo?.label }
				</div>
			) }
		</PostPanelRow>
	);
}
