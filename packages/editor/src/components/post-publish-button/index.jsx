import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Tooltip } from '@wordpress/ui';
import PublishButtonLabel from './label';
import { store as editorStore } from '../../store';
import { EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const noop = () => {};

export function PostPublishButton( {
	forceIsDirty,
	isOpen,
	isToggle,
	onSubmit = noop,
	onToggle,
	setEntitiesSavedStatesCallback,
} ) {
	const {
		hasPublishAction,
		isBeingScheduled,
		isPostSavingLocked,
		isPublishable,
		isPublished,
		isSaveable,
		isSaving,
		isAutoSaving,
		visibility,
		hasNonPostEntityChanges,
		isSavingNonPostEntityChanges,
		postStatus,
		postStatusHasChanged,
		postType,
		postId,
		isSuggesting,
	} = useSelect( ( select ) => {
		const store = select( editorStore );
		return {
			isSaving: store.isSavingPost(),
			isAutoSaving: store.isAutosavingPost(),
			isBeingScheduled: store.isEditedPostBeingScheduled(),
			visibility: store.getEditedPostVisibility(),
			isSaveable: store.isEditedPostSaveable(),
			isPostSavingLocked: store.isPostSavingLocked(),
			isPublishable: store.isEditedPostPublishable(),
			isPublished: store.isCurrentPostPublished(),
			hasPublishAction:
				!! store.getCurrentPost()?._links?.[ 'wp:action-publish' ],
			postType: store.getCurrentPostType(),
			postId: store.getCurrentPostId(),
			postStatus: store.getEditedPostAttribute( 'status' ),
			postStatusHasChanged: store.getPostEdits()?.status,
			hasNonPostEntityChanges: store.hasNonPostEntityChanges(),
			isSavingNonPostEntityChanges: store.isSavingNonPostEntityChanges(),
			// `getEditorIntent` is private while Suggest mode is experimental.
			isSuggesting:
				unlock( store ).getEditorIntent() === EDITOR_INTENT_SUGGEST,
		};
	}, [] );

	const { editPost, savePost } = useDispatch( editorStore );

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

	/*
	 * Publishing is the editorial decision Suggest mode exists to withhold,
	 * and so are scheduling and submitting for review: each moves the post
	 * along the workflow. A click that leaves the status where it is - the
	 * "Save" of a published or scheduled post - is a plain save, and suggesting
	 * has no save lock: suggestions write their markers into the post content,
	 * so on a published post this button is the only way to persist them.
	 * Withhold the status change, not the save. See issue #73411 (F-15).
	 */
	const isPublishWithheld = isSuggesting && publishStatus !== postStatus;

	const savePostStatus = ( status ) => {
		editPost( { status }, { undoIgnore: true } );
		savePost();
	};

	const createOnClick =
		( callback ) =>
		( ...args ) => {
			/*
			 * Both controls are disabled while the status change is withheld,
			 * but they carry `aria-disabled` rather than `disabled`, so the
			 * click still arrives here - ahead of the callbacks that check for
			 * it. Stop at the seam: otherwise a dirty non-post entity sends a
			 * control reporting `aria-disabled="true"` on to open the "Are you
			 * ready to save?" dialog. See issue #73411 (F-15).
			 */
			if ( isPublishWithheld ) {
				return noop;
			}

			// If a post with non-post entities is published, but the user
			// elects to not save changes to the non-post entities, those
			// entities will still be dirty when the Publish button is clicked.
			// We also need to check that the `setEntitiesSavedStatesCallback`
			// prop was passed. See https://github.com/WordPress/gutenberg/pull/37383
			if ( hasNonPostEntityChanges && setEntitiesSavedStatesCallback ) {
				// The modal for multiple entity saving will open. If the post
				// entity is checked when it closes, run the held callback.
				const onClose = ( savedEntities ) => {
					if (
						savedEntities &&
						savedEntities.some(
							( elt ) =>
								elt.kind === 'postType' &&
								elt.name === postType &&
								elt.key === postId
						)
					) {
						callback( ...args );
					}
				};

				// Open the save panel by setting its callback.
				// To set a function on the useState hook, we must set it
				// with another function (() => myFunction). Passing the
				// function on its own will cause an error when called.
				setEntitiesSavedStatesCallback( () => onClose );
				return noop;
			}

			return callback( ...args );
		};

	/*
	 * `editPost` drops a withheld status, but the button doesn't stop at the
	 * status edit: it calls `savePost()` right after, which would write the
	 * post to the server while the pre-publish flow waits on a state change
	 * that never comes. Disable the control rather than let it run half of
	 * itself.
	 */
	const isButtonDisabled =
		isPublishWithheld ||
		isPostSavingLocked ||
		// Disable while a non-post entity (e.g. a newly created term) is mid-save.
		isSavingNonPostEntityChanges ||
		( ( isSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty ) ) &&
			! hasNonPostEntityChanges );

	const isToggleDisabled =
		isPublishWithheld ||
		isPostSavingLocked ||
		isSavingNonPostEntityChanges ||
		( ( isPublished ||
			isSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty ) ) &&
			! hasNonPostEntityChanges );

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
		'aria-disabled': isButtonDisabled,
		className: 'editor-post-publish-button',
		isBusy: ! isAutoSaving && isSaving,
		variant: 'primary',
		onClick: createOnClick( onClickButton ),
		'aria-haspopup': hasNonPostEntityChanges ? 'dialog' : undefined,
	};

	const toggleProps = {
		'aria-disabled': isToggleDisabled,
		'aria-expanded': isOpen,
		className: 'editor-post-publish-panel__toggle',
		isBusy: isSaving && isPublished,
		variant: 'primary',
		size: 'compact',
		onClick: createOnClick( onClickToggle ),
		'aria-haspopup': hasNonPostEntityChanges ? 'dialog' : undefined,
	};
	const componentProps = isToggle ? toggleProps : buttonProps;
	const withheldHint = __( 'Switch to Editing to change the post status.' );
	const button = (
		<Button
			{ ...componentProps }
			className={ `${ componentProps.className } editor-post-publish-button__button` }
			size="compact"
			/*
			 * `description` rather than `label`, which doubles as the button's
			 * `aria-label` and would replace the visible "Publish" / "Update"
			 * text as its accessible name.
			 */
			description={ isPublishWithheld ? withheldHint : undefined }
		>
			<PublishButtonLabel />
		</Button>
	);

	if ( ! isPublishWithheld ) {
		return button;
	}

	/*
	 * `description` carries the reason to assistive technology; the tooltip
	 * carries it to everyone else. Tooltip popups are visual-only by design,
	 * so neither channel covers for the other.
	 */
	return (
		<Tooltip.Root>
			<Tooltip.Trigger render={ button } />
			<Tooltip.Popup>{ withheldHint }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * Renders the publish button.
 */
export default PostPublishButton;
