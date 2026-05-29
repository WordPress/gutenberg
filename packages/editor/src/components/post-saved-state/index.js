/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__unstableGetAnimateClassName as getAnimateClassName,
	Button,
} from '@wordpress/components';
import { usePrevious, useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check, cloud, cloudUpload } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { STATUS_OPTIONS } from '../../components/post-status';
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE } from '../../store/constants';
import {
	getDistributedEditingSaveJourneyDataAttributes,
	getDistributedEditingSaveJourneyTitle,
} from '../distributed-editing-save-journey-cue';
import DistributedEditingServerSyncButton from '../distributed-editing-server-sync-button';

/**
 * Component showing whether the post is saved or not and providing save
 * buttons.
 *
 * @param {Object}   props              Component props.
 * @param {?boolean} props.forceIsDirty Whether to force the post to be marked
 *                                      as dirty.
 * @return {React.ComponentType} The component.
 */
export default function PostSavedState( { forceIsDirty } ) {
	const [ forceSavedMessage, setForceSavedMessage ] = useState( false );
	const isLargeViewport = useViewportMatch( 'small' );

	const {
		isAutosaving,
		isDirty,
		isNew,
		isPublished,
		isSaveable,
		isSaving,
		isSavingLocked,
		isScheduled,
		hasPublishAction,
		showIconLabels,
		postStatus,
		postStatusHasChanged,
		postType,
		distributedEditingSaveButtonState,
		distributedEditingSaveJourneyState,
	} = useSelect(
		( select ) => {
			const {
				isEditedPostNew,
				isCurrentPostPublished,
				isCurrentPostScheduled,
				isEditedPostDirty,
				isSavingPost,
				isEditedPostSaveable,
				isPostSavingLocked,
				getCurrentPost,
				isAutosavingPost,
				getEditedPostAttribute,
				getPostEdits,
				getDistributedEditingSaveButtonState,
				getDistributedEditingSaveJourneyState,
				getDistributedEditingDocumentDirtyState,
				hasPendingDistributedEditingChanges,
			} = select( editorStore );
			const { get } = select( preferencesStore );
			const distributedEditingDocumentDirtyState =
				getDistributedEditingDocumentDirtyState?.() || {};
			const editorIsDirty =
				forceIsDirty ||
				isEditedPostDirty() ||
				Boolean( distributedEditingDocumentDirtyState.isDirty ) ||
				Boolean( hasPendingDistributedEditingChanges?.() );

			return {
				isAutosaving: isAutosavingPost(),
				isDirty: editorIsDirty,
				isNew: isEditedPostNew(),
				isPublished: isCurrentPostPublished(),
				isSaving: isSavingPost(),
				isSaveable: isEditedPostSaveable(),
				isSavingLocked: isPostSavingLocked(),
				isScheduled: isCurrentPostScheduled(),
				hasPublishAction:
					getCurrentPost()?._links?.[ 'wp:action-publish' ] ?? false,
				showIconLabels: get( 'core', 'showIconLabels' ),
				postStatus: getEditedPostAttribute( 'status' ),
				postStatusHasChanged: !! getPostEdits()?.status,
				postType: select( editorStore ).getCurrentPostType(),
				distributedEditingSaveButtonState:
					getDistributedEditingSaveButtonState?.(),
				distributedEditingSaveJourneyState:
					getDistributedEditingSaveJourneyState?.( editorIsDirty ),
			};
		},
		[ forceIsDirty ]
	);
	const isPending = postStatus === 'pending';
	const {
		__experimentalMaybeHandleDistributedEditingSaveButtonClick,
		savePost,
	} = useDispatch( editorStore );

	const wasSaving = usePrevious( isSaving );

	useEffect( () => {
		let timeoutId;

		if ( wasSaving && ! isSaving ) {
			setForceSavedMessage( true );
			timeoutId = setTimeout( () => {
				setForceSavedMessage( false );
			}, 1000 );
		}

		return () => clearTimeout( timeoutId );
	}, [ isSaving, wasSaving ] );

	// Attachments don't support draft mode, so hide this button.
	if ( postType === ATTACHMENT_POST_TYPE ) {
		return null;
	}

	// Once the post has been submitted for review this button
	// is not needed for the contributor role.
	if ( ! hasPublishAction && isPending ) {
		return null;
	}

	// We shouldn't render the button if the post has not one of the following statuses: pending, draft, auto-draft.
	// The reason for this is that this button handles the `save as pending` and `save draft` actions.
	// An exception for this is when the post has a custom status and there should be a way to save changes without
	// having to publish. This should be handled better in the future when custom statuses have better support.
	// @see https://github.com/WordPress/gutenberg/issues/3144.
	const isIneligibleStatus =
		! [ 'pending', 'draft', 'auto-draft' ].includes( postStatus ) &&
		STATUS_OPTIONS.map( ( { value } ) => value ).includes( postStatus );

	if (
		isPublished ||
		isScheduled ||
		isIneligibleStatus ||
		( postStatusHasChanged &&
			[ 'pending', 'draft' ].includes( postStatus ) )
	) {
		return null;
	}

	/* translators: button label text should, if possible, be under 16 characters. */
	const label = isPending ? __( 'Save as pending' ) : __( 'Save draft' );

	/* translators: button label text should, if possible, be under 16 characters. */
	const shortLabel = __( 'Save' );

	const hasDistributedEditingSaveButtonState = Boolean(
		distributedEditingSaveButtonState?.status &&
			distributedEditingSaveButtonState.status !== 'update_ready'
	);
	const distributedEditingSaveButtonDisabled = Boolean(
		hasDistributedEditingSaveButtonState &&
			distributedEditingSaveButtonState.disabled
	);
	const distributedEditingSaveButtonBusy = Boolean(
		hasDistributedEditingSaveButtonState &&
			distributedEditingSaveButtonState.busy
	);
	const distributedEditingAuthoritativePostUpdated = Boolean(
		hasDistributedEditingSaveButtonState &&
			distributedEditingSaveButtonState.authoritativePostUpdated
	);
	const hasDistributedEditingSaveJourneyState = Boolean(
		distributedEditingSaveJourneyState?.shouldExposeInSaveControls
	);
	const distributedEditingSaveButtonDataAttributes =
		hasDistributedEditingSaveButtonState
			? {
					'data-distributed-editing-save-button-status':
						distributedEditingSaveButtonState.status,
					'data-distributed-editing-save-button-source':
						distributedEditingSaveButtonState.source || undefined,
					'data-distributed-editing-save-button-click-action':
						distributedEditingSaveButtonState.clickAction ||
						undefined,
					'data-distributed-editing-save-button-reason':
						distributedEditingSaveButtonState.reason || undefined,
					'data-distributed-editing-save-button-authority-state':
						distributedEditingSaveButtonState.authorityState ||
						undefined,
					'data-distributed-editing-save-button-local-changes-state':
						distributedEditingSaveButtonState.localChangesState ||
						undefined,
					'data-distributed-editing-save-button-review-checkpoint-state':
						distributedEditingSaveButtonState.reviewCheckpointState ||
						undefined,
					'data-distributed-editing-save-button-authoritative-post-state':
						distributedEditingSaveButtonState.authoritativePostState ||
						undefined,
					'data-distributed-editing-save-button-state-summary':
						distributedEditingSaveButtonState.saveStateSummaryText ||
						undefined,
					'data-distributed-editing-save-button-authoritative-post-updated':
						String( distributedEditingAuthoritativePostUpdated ),
			  }
			: {};
	const distributedEditingSaveJourneyDataAttributes =
		getDistributedEditingSaveJourneyDataAttributes(
			distributedEditingSaveJourneyState
		);
	const isSaved = ! isDirty && ( forceSavedMessage || ! isNew );
	const isSavedState = hasDistributedEditingSaveButtonState
		? distributedEditingSaveButtonBusy ||
		  distributedEditingAuthoritativePostUpdated
		: isSaving || isSaved;
	const isDisabled = hasDistributedEditingSaveButtonState
		? distributedEditingSaveButtonDisabled
		: isSaving || isSaved || ! isSaveable || isSavingLocked;
	let buttonTitle;
	if ( hasDistributedEditingSaveJourneyState ) {
		buttonTitle = getDistributedEditingSaveJourneyTitle(
			distributedEditingSaveJourneyState
		);
	} else if ( hasDistributedEditingSaveButtonState ) {
		buttonTitle = distributedEditingSaveButtonState.statusText;
	}
	let text;

	if ( hasDistributedEditingSaveButtonState ) {
		text = distributedEditingSaveButtonState.label;
	} else if ( isSaving ) {
		text = isAutosaving ? __( 'Autosaving' ) : __( 'Saving' );
	} else if ( isSaved ) {
		text = __( 'Saved' );
	} else if ( isLargeViewport ) {
		text = label;
	} else if ( showIconLabels ) {
		text = shortLabel;
	}

	// Use common Button instance for all saved states so that focus is not
	// lost.
	const onSaveClick = async () => {
		const saveButtonClickRouting =
			await __experimentalMaybeHandleDistributedEditingSaveButtonClick?.();

		if (
			saveButtonClickRouting &&
			! saveButtonClickRouting.allowsNormalSaveFallback
		) {
			return saveButtonClickRouting;
		}

		return savePost();
	};

	return (
		<>
			<Button
				{ ...distributedEditingSaveButtonDataAttributes }
				{ ...distributedEditingSaveJourneyDataAttributes }
				className={
					isSaveable ||
					isSaving ||
					hasDistributedEditingSaveButtonState
						? clsx( {
								'editor-post-save-draft': ! isSavedState,
								'editor-post-saved-state': isSavedState,
								'is-saving':
									isSaving ||
									distributedEditingSaveButtonBusy,
								'is-autosaving': isAutosaving,
								'is-saved':
									isSaved ||
									distributedEditingAuthoritativePostUpdated,
								[ getAnimateClassName( {
									type: 'loading',
								} ) ]:
									isSaving ||
									distributedEditingSaveButtonBusy,
						  } )
						: undefined
				}
				onClick={ isDisabled ? undefined : onSaveClick }
				/*
				 * We want the tooltip to show the keyboard shortcut only when the
				 * button does something, i.e. when it's not disabled.
				 */
				shortcut={
					isDisabled ? undefined : displayShortcut.primary( 's' )
				}
				variant="tertiary"
				size="compact"
				isBusy={ isSaving || distributedEditingSaveButtonBusy }
				icon={ isLargeViewport ? undefined : cloudUpload }
				label={ text || label }
				aria-disabled={ isDisabled }
				title={ buttonTitle }
			>
				{ isSavedState && (
					<Icon
						icon={
							isSaved ||
							distributedEditingAuthoritativePostUpdated
								? check
								: cloud
						}
					/>
				) }
				{ text }
			</Button>
			<DistributedEditingServerSyncButton />
		</>
	);
}
