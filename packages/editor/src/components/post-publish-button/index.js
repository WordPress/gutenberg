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
} from '../distributed-editing-save-journey-cue';

const noop = () => {};

export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );

		this.createOnClick = this.createOnClick.bind( this );
		this.closeEntitiesSavedStates =
			this.closeEntitiesSavedStates.bind( this );

		this.state = {
			entitiesSavedStatesCallback: false,
		};
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

	render() {
		const {
			forceIsDirty,
			hasPublishAction,
			isBeingScheduled,
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
			visibility,
			hasNonPostEntityChanges,
			isSavingNonPostEntityChanges,
			postStatus,
			postStatusHasChanged,
			distributedEditingSaveButtonState,
			distributedEditingSaveJourneyState,
		} = this.props;
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
		const distributedEditingSaveButtonStatusText =
			hasDistributedEditingSaveButtonState
				? distributedEditingSaveButtonState.statusText
				: undefined;
		const hasDistributedEditingSaveJourneyState = Boolean(
			distributedEditingSaveJourneyState?.shouldExposeInSaveControls
		);
		const distributedEditingSaveButtonDataAttributes =
			hasDistributedEditingSaveButtonState
				? {
						'data-distributed-editing-save-button-status':
							distributedEditingSaveButtonState.status,
						'data-distributed-editing-save-button-source':
							distributedEditingSaveButtonState.source ||
							undefined,
						'data-distributed-editing-save-button-click-action':
							distributedEditingSaveButtonState.clickAction ||
							undefined,
						'data-distributed-editing-save-button-reason':
							distributedEditingSaveButtonState.reason ||
							undefined,
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
							String(
								Boolean(
									distributedEditingSaveButtonState.authoritativePostUpdated
								)
							),
				  }
				: {};
		const distributedEditingSaveJourneyDataAttributes =
			getDistributedEditingSaveJourneyDataAttributes(
				distributedEditingSaveJourneyState
			);
		const distributedEditingSaveControlTitle =
			hasDistributedEditingSaveJourneyState
				? distributedEditingSaveJourneyState.summary
				: distributedEditingSaveButtonStatusText;

		const isButtonDisabled =
			isPostSavingLocked ||
			distributedEditingSaveButtonDisabled ||
			( ( isSaving ||
				! isSaveable ||
				( ! isPublishable && ! forceIsDirty ) ) &&
				( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges ) );

		const isToggleDisabled =
			isPostSavingLocked ||
			distributedEditingSaveButtonDisabled ||
			( ( isPublished ||
				isSaving ||
				! isSaveable ||
				( ! isPublishable && ! forceIsDirty ) ) &&
				( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges ) );

		// If the new status has not changed explicitly, we derive it from
		// other factors, like having a publish action, etc.. We need to preserve
		// this because it affects when to show the pre and post publish panels.
		// If it has changed though explicitly, we need to respect that.
		let publishStatus = 'publish';
		if ( postStatusHasChanged ) {
			publishStatus = postStatus;
		} else if ( ! hasPublishAction ) {
			publishStatus = 'pending';
		} else if ( visibility === 'private' ) {
			publishStatus = 'private';
		} else if ( isBeingScheduled ) {
			publishStatus = 'future';
		}

		const onClickButton = () => {
			if ( isButtonDisabled ) {
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
			onToggle();
		};

		const buttonProps = {
			...distributedEditingSaveButtonDataAttributes,
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
							distributedEditingSaveButtonState
						}
					/>
				</Button>
				<DistributedEditingSaveJourneyCue
					className="editor-post-publish-button__distributed-editing-save-journey-cue"
					saveJourneyState={ distributedEditingSaveJourneyState }
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
				getDistributedEditingSaveJourneyState?.(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			__experimentalMaybeHandleDistributedEditingSaveButtonClick,
			editPost,
			savePost,
		} = dispatch( editorStore );
		return {
			savePostStatus: async ( status ) => {
				const saveButtonClickRouting =
					await __experimentalMaybeHandleDistributedEditingSaveButtonClick();

				if ( ! saveButtonClickRouting.allowsNormalSaveFallback ) {
					return saveButtonClickRouting;
				}

				editPost( { status }, { undoIgnore: true } );
				return savePost();
			},
		};
	} ),
] )( PostPublishButton );
