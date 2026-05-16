/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
import { store as editorStore } from '../../store';
import DistributedEditingSaveJourneyCue, {
	getDistributedEditingSaveJourneyDataAttributes,
	getDistributedEditingSaveJourneyTitle,
} from '../distributed-editing-save-journey-cue';

const noop = () => {};
const DISTRIBUTED_EDITING_OPEN_PRE_PUBLISH_REVIEW_ACTION =
	'open_pre_publish_review';
const DISTRIBUTED_EDITING_CONFIRMED_SAVE_BUTTON_STATUS = 'retry_save_confirmed';
const DISTRIBUTED_EDITING_CONFIRMED_SAVE_BUTTON_HOLD_MS = 7000;
const DISTRIBUTED_EDITING_QUIETED_CONFIRMED_SAVE_JOURNEY_STATE = Object.freeze(
	{
		shouldExposeInSaveControls: true,
		step: 'ready_to_edit',
		action: 'edit',
		title: 'Save is available',
		summary:
			'Use Save when you are ready for WordPress to update this post.',
		statusChromeSummary:
			'Save can update the authoritative WordPress post.',
		statusChromeAuthorityState: 'ready_to_update_authoritative_post',
		statusChromeAuthorityText:
			'Save can update the authoritative WordPress post.',
		claimsSavedWithoutEvidence: false,
	}
);

function getDistributedEditingConfirmedSaveButtonHoldMs() {
	const holdMs =
		globalThis.__experimentalDistributedEditingConfirmedSaveButtonHoldMs;

	if (
		typeof holdMs === 'number' &&
		Number.isFinite( holdMs ) &&
		holdMs >= 0
	) {
		return holdMs;
	}

	return DISTRIBUTED_EDITING_CONFIRMED_SAVE_BUTTON_HOLD_MS;
}

function isQuietableDistributedEditingConfirmedSaveButtonState(
	saveButtonState
) {
	return Boolean(
		saveButtonState?.status ===
			DISTRIBUTED_EDITING_CONFIRMED_SAVE_BUTTON_STATUS &&
			saveButtonState.hasRetrySaveSavedStateEvidence &&
			saveButtonState.authoritativePostUpdated &&
			! saveButtonState.hasProtectedLocalChanges &&
			! saveButtonState.pendingServerConfirmation
	);
}

function getQuietableDistributedEditingConfirmedSaveButtonKey(
	saveButtonState
) {
	if (
		! isQuietableDistributedEditingConfirmedSaveButtonState(
			saveButtonState
		)
	) {
		return null;
	}

	return [
		saveButtonState.status,
		saveButtonState.reason || '',
		saveButtonState.source || '',
		saveButtonState.authorityState || '',
		saveButtonState.localChangesState || '',
		saveButtonState.reviewCheckpointState || '',
		saveButtonState.authoritativePostState || '',
		saveButtonState.saveStateSummaryText || '',
	].join( ':' );
}

export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );

		this.createOnClick = this.createOnClick.bind( this );
		this.closeEntitiesSavedStates =
			this.closeEntitiesSavedStates.bind( this );
		this.updateDistributedEditingConfirmedSaveButtonTimer =
			this.updateDistributedEditingConfirmedSaveButtonTimer.bind( this );

		this.state = {
			entitiesSavedStatesCallback: false,
			distributedEditingConfirmedSaveButtonKey: null,
			isDistributedEditingConfirmedSaveButtonQuieted: false,
		};
	}

	componentDidMount() {
		this.updateDistributedEditingConfirmedSaveButtonTimer();
	}

	componentDidUpdate() {
		this.updateDistributedEditingConfirmedSaveButtonTimer();
	}

	componentWillUnmount() {
		clearTimeout( this.distributedEditingConfirmedSaveButtonTimer );
	}

	updateDistributedEditingConfirmedSaveButtonTimer() {
		const nextConfirmedSaveButtonKey =
			getQuietableDistributedEditingConfirmedSaveButtonKey(
				this.props.distributedEditingSaveButtonState
			);
		const {
			distributedEditingConfirmedSaveButtonKey:
				currentConfirmedSaveButtonKey,
			isDistributedEditingConfirmedSaveButtonQuieted,
		} = this.state;

		if ( ! nextConfirmedSaveButtonKey ) {
			clearTimeout( this.distributedEditingConfirmedSaveButtonTimer );

			if (
				currentConfirmedSaveButtonKey ||
				isDistributedEditingConfirmedSaveButtonQuieted
			) {
				this.setState( {
					distributedEditingConfirmedSaveButtonKey: null,
					isDistributedEditingConfirmedSaveButtonQuieted: false,
				} );
			}

			return;
		}

		if ( nextConfirmedSaveButtonKey === currentConfirmedSaveButtonKey ) {
			return;
		}

		clearTimeout( this.distributedEditingConfirmedSaveButtonTimer );
		this.setState( {
			distributedEditingConfirmedSaveButtonKey:
				nextConfirmedSaveButtonKey,
			isDistributedEditingConfirmedSaveButtonQuieted: false,
		} );
		this.distributedEditingConfirmedSaveButtonTimer = setTimeout( () => {
			if (
				getQuietableDistributedEditingConfirmedSaveButtonKey(
					this.props.distributedEditingSaveButtonState
				) !== nextConfirmedSaveButtonKey
			) {
				return;
			}

			this.setState( {
				isDistributedEditingConfirmedSaveButtonQuieted: true,
			} );
		}, getDistributedEditingConfirmedSaveButtonHoldMs() );
	}

	createOnClick( callback ) {
		return ( ...args ) => {
			const { hasNonPostEntityChanges, setEntitiesSavedStatesCallback } =
				this.props;
			// If a post with non-post entities is published, but the user
			// elects to not save changes to the non-post entities, those
			// entities will still be dirty when the Publish button is clicked.
			// We also need to check that the `setEntitiesSavedStatesCallback`
			// prop was passed. See https://github.com/WordPress/gutenberg/pull/37383
			if ( hasNonPostEntityChanges && setEntitiesSavedStatesCallback ) {
				// The modal for multiple entity saving will open,
				// hold the callback for saving/publishing the post
				// so that we can call it if the post entity is checked.
				this.setState( {
					entitiesSavedStatesCallback: () => callback( ...args ),
				} );

				// Open the save panel by setting its callback.
				// To set a function on the useState hook, we must set it
				// with another function (() => myFunction). Passing the
				// function on its own will cause an error when called.
				setEntitiesSavedStatesCallback(
					() => this.closeEntitiesSavedStates
				);
				return noop;
			}

			return callback( ...args );
		};
	}

	closeEntitiesSavedStates( savedEntities ) {
		const { postType, postId } = this.props;
		const { entitiesSavedStatesCallback } = this.state;
		this.setState( { entitiesSavedStatesCallback: false }, () => {
			if (
				savedEntities &&
				savedEntities.some(
					( elt ) =>
						elt.kind === 'postType' &&
						elt.name === postType &&
						elt.key === postId
				)
			) {
				// The post entity was checked, call the held callback from `createOnClick`.
				entitiesSavedStatesCallback();
			}
		} );
	}

	getPublishStatus() {
		const {
			hasPublishAction,
			isBeingScheduled,
			visibility,
			postStatus,
			postStatusHasChanged,
		} = this.props;

		if ( postStatusHasChanged ) {
			return postStatus;
		}

		if ( ! hasPublishAction ) {
			return 'pending';
		}

		if ( visibility === 'private' ) {
			return 'private';
		}

		if ( isBeingScheduled ) {
			return 'future';
		}

		return 'publish';
	}

	render() {
		const {
			forceIsDirty,
			isOpen,
			isPostSavingLocked,
			isPublishable,
			isPublished,
			isSaveable,
			isSaving,
			isAutoSaving,
			isToggle,
			savePostStatus,
			onSubmit = noop,
			onToggle,
			hasNonPostEntityChanges,
			isSavingNonPostEntityChanges,
			distributedEditingSaveButtonState,
			distributedEditingSaveJourneyState,
		} = this.props;
		const isQuietableDistributedEditingConfirmedSaveButton =
			isQuietableDistributedEditingConfirmedSaveButtonState(
				distributedEditingSaveButtonState
			);
		const isDistributedEditingConfirmedSaveButtonQuieted = Boolean(
			isQuietableDistributedEditingConfirmedSaveButton &&
				this.state.isDistributedEditingConfirmedSaveButtonQuieted
		);
		const visibleDistributedEditingSaveButtonState =
			isDistributedEditingConfirmedSaveButtonQuieted
				? undefined
				: distributedEditingSaveButtonState;
		const visibleDistributedEditingSaveJourneyState =
			isDistributedEditingConfirmedSaveButtonQuieted
				? DISTRIBUTED_EDITING_QUIETED_CONFIRMED_SAVE_JOURNEY_STATE
				: distributedEditingSaveJourneyState;
		const hasDistributedEditingSaveButtonState = Boolean(
			visibleDistributedEditingSaveButtonState?.status &&
				visibleDistributedEditingSaveButtonState.status !==
					'update_ready'
		);
		const shouldRouteDistributedEditingToggleClick = Boolean(
			hasDistributedEditingSaveButtonState &&
				visibleDistributedEditingSaveButtonState.clickAction &&
				visibleDistributedEditingSaveButtonState.clickAction !==
					DISTRIBUTED_EDITING_OPEN_PRE_PUBLISH_REVIEW_ACTION
		);
		const distributedEditingSaveButtonDisabled = Boolean(
			hasDistributedEditingSaveButtonState &&
				visibleDistributedEditingSaveButtonState.disabled
		);
		const distributedEditingSaveButtonBusy = Boolean(
			hasDistributedEditingSaveButtonState &&
				visibleDistributedEditingSaveButtonState.busy
		);
		const distributedEditingSaveButtonStatusText =
			hasDistributedEditingSaveButtonState
				? visibleDistributedEditingSaveButtonState.statusText
				: undefined;
		const hasDistributedEditingSaveJourneyState = Boolean(
			visibleDistributedEditingSaveJourneyState?.shouldExposeInSaveControls
		);
		const distributedEditingSaveButtonDataAttributes =
			hasDistributedEditingSaveButtonState
				? {
						'data-distributed-editing-save-button-status':
							visibleDistributedEditingSaveButtonState.status,
						'data-distributed-editing-save-button-source':
							visibleDistributedEditingSaveButtonState.source ||
							undefined,
						'data-distributed-editing-save-button-click-action':
							visibleDistributedEditingSaveButtonState.clickAction ||
							undefined,
						'data-distributed-editing-save-button-reason':
							visibleDistributedEditingSaveButtonState.reason ||
							undefined,
						'data-distributed-editing-save-button-authority-state':
							visibleDistributedEditingSaveButtonState.authorityState ||
							undefined,
						'data-distributed-editing-save-button-local-changes-state':
							visibleDistributedEditingSaveButtonState.localChangesState ||
							undefined,
						'data-distributed-editing-save-button-review-checkpoint-state':
							visibleDistributedEditingSaveButtonState.reviewCheckpointState ||
							undefined,
						'data-distributed-editing-save-button-authoritative-post-state':
							visibleDistributedEditingSaveButtonState.authoritativePostState ||
							undefined,
						'data-distributed-editing-save-button-state-summary':
							visibleDistributedEditingSaveButtonState.saveStateSummaryText ||
							undefined,
						'data-distributed-editing-save-button-authoritative-post-updated':
							String(
								Boolean(
									visibleDistributedEditingSaveButtonState.authoritativePostUpdated
								)
							),
				  }
				: {};
		const distributedEditingConfirmedSaveButtonDataAttributes =
			isQuietableDistributedEditingConfirmedSaveButton
				? {
						'data-distributed-editing-confirmed-save-button-evidence-retained':
							'true',
						'data-distributed-editing-confirmed-save-button-quieted':
							String(
								isDistributedEditingConfirmedSaveButtonQuieted
							),
						'data-distributed-editing-confirmed-save-button-original-status':
							distributedEditingSaveButtonState.status,
				  }
				: {};
		const distributedEditingSaveJourneyDataAttributes =
			getDistributedEditingSaveJourneyDataAttributes(
				visibleDistributedEditingSaveJourneyState
			);
		const distributedEditingSaveControlTitle =
			hasDistributedEditingSaveJourneyState
				? getDistributedEditingSaveJourneyTitle(
						visibleDistributedEditingSaveJourneyState
				  )
				: distributedEditingSaveButtonStatusText;

		const isButtonDisabled = hasDistributedEditingSaveButtonState
			? distributedEditingSaveButtonDisabled
			: isPostSavingLocked ||
			  ( ( isSaving ||
					! isSaveable ||
					( ! isPublishable && ! forceIsDirty ) ) &&
					( ! hasNonPostEntityChanges ||
						isSavingNonPostEntityChanges ) );

		const isToggleDisabled = hasDistributedEditingSaveButtonState
			? distributedEditingSaveButtonDisabled
			: isPostSavingLocked ||
			  ( ( isPublished ||
					isSaving ||
					! isSaveable ||
					( ! isPublishable && ! forceIsDirty ) ) &&
					( ! hasNonPostEntityChanges ||
						isSavingNonPostEntityChanges ) );

		// If the new status has not changed explicitly, we derive it from
		// other factors, like having a publish action, etc.. We need to preserve
		// this because it affects when to show the pre and post publish panels.
		// If it has changed though explicitly, we need to respect that.
		const publishStatus = this.getPublishStatus();

		const onClickButton = () => {
			if ( isButtonDisabled ) {
				return;
			}
			const distributedEditingClickOptions =
				isDistributedEditingConfirmedSaveButtonQuieted
					? {
							__experimentalAllowDistributedEditingConfirmedSaveNormalFallback: true,
					  }
					: undefined;

			if ( distributedEditingClickOptions ) {
				onSubmit( distributedEditingClickOptions );
				savePostStatus( publishStatus, distributedEditingClickOptions );
				return;
			}

			onSubmit();
			savePostStatus( publishStatus );
		};

		// Callback to open the publish panel.
		const onClickToggle = () => {
			if ( isToggleDisabled ) {
				return;
			}
			if ( shouldRouteDistributedEditingToggleClick ) {
				savePostStatus( publishStatus );
				return;
			}
			onToggle();
		};

		const buttonProps = {
			...distributedEditingSaveButtonDataAttributes,
			...distributedEditingConfirmedSaveButtonDataAttributes,
			...distributedEditingSaveJourneyDataAttributes,
			'aria-disabled': isButtonDisabled,
			className: 'editor-post-publish-button',
			isBusy:
				( ! isAutoSaving && isSaving ) ||
				distributedEditingSaveButtonBusy,
			variant: 'primary',
			onClick: this.createOnClick( onClickButton ),
			'aria-haspopup': hasNonPostEntityChanges ? 'dialog' : undefined,
			title: distributedEditingSaveControlTitle,
		};

		const toggleProps = {
			...distributedEditingSaveButtonDataAttributes,
			...distributedEditingConfirmedSaveButtonDataAttributes,
			...distributedEditingSaveJourneyDataAttributes,
			'aria-disabled': isToggleDisabled,
			'aria-expanded': isOpen,
			className: 'editor-post-publish-panel__toggle',
			isBusy:
				( isSaving && isPublished ) || distributedEditingSaveButtonBusy,
			variant: 'primary',
			size: 'compact',
			onClick: this.createOnClick( onClickToggle ),
			'aria-haspopup': hasNonPostEntityChanges ? 'dialog' : undefined,
			title: distributedEditingSaveControlTitle,
		};
		const componentProps = isToggle ? toggleProps : buttonProps;
		return (
			<>
				<Button
					{ ...componentProps }
					className={ `${ componentProps.className } editor-post-publish-button__button` }
					size="compact"
				>
					<PublishButtonLabel
						distributedEditingSaveButtonState={
							visibleDistributedEditingSaveButtonState
						}
					/>
				</Button>
				<DistributedEditingSaveJourneyCue
					className="editor-post-publish-button__distributed-editing-save-journey-cue"
					saveJourneyState={
						visibleDistributedEditingSaveJourneyState
					}
				/>
			</>
		);
	}
}

/**
 * Renders the publish button.
 */
export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isAutosavingPost,
			isEditedPostBeingScheduled,
			isEditedPostDirty,
			getEditedPostVisibility,
			isCurrentPostPublished,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isPostSavingLocked,
			getCurrentPost,
			getCurrentPostType,
			getCurrentPostId,
			hasNonPostEntityChanges,
			isSavingNonPostEntityChanges,
			getEditedPostAttribute,
			getPostEdits,
			getDistributedEditingSaveButtonState,
			getDistributedEditingSaveJourneyState,
		} = select( editorStore );
		return {
			isSaving: isSavingPost(),
			isAutoSaving: isAutosavingPost(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			visibility: getEditedPostVisibility(),
			isSaveable: isEditedPostSaveable(),
			isPostSavingLocked: isPostSavingLocked(),
			isPublishable: isEditedPostPublishable(),
			isPublished: isCurrentPostPublished(),
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			postStatus: getEditedPostAttribute( 'status' ),
			postStatusHasChanged: getPostEdits()?.status,
			hasNonPostEntityChanges: hasNonPostEntityChanges(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
			distributedEditingSaveButtonState:
				getDistributedEditingSaveButtonState?.(),
			distributedEditingSaveJourneyState:
				getDistributedEditingSaveJourneyState?.( isEditedPostDirty() ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			__experimentalMaybeHandleDistributedEditingSaveButtonClick,
			editPost,
			savePost,
		} = dispatch( editorStore );
		return {
			savePostStatus: async ( status, options = {} ) => {
				const saveButtonClickRouting =
					await __experimentalMaybeHandleDistributedEditingSaveButtonClick(
						options
					);

				if ( ! saveButtonClickRouting.allowsNormalSaveFallback ) {
					return saveButtonClickRouting;
				}

				editPost( { status }, { undoIgnore: true } );
				return savePost();
			},
		};
	} ),
] )( PostPublishButton );
