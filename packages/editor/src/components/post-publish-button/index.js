/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
import { store as editorStore } from '../../store';

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
		};
	}, [] );

	const { editPost, savePost } = useDispatch( editorStore );

	const savePostStatus = ( status ) => {
		editPost( { status }, { undoIgnore: true } );
		savePost();
	};

	const createOnClick =
		( callback ) =>
		( ...args ) => {
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

	const isButtonDisabled =
		isPostSavingLocked ||
		// Disable while a non-post entity (e.g. a newly created term) is mid-save.
		isSavingNonPostEntityChanges ||
		( ( isSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty ) ) &&
			! hasNonPostEntityChanges );

	const isToggleDisabled =
		isPostSavingLocked ||
		isSavingNonPostEntityChanges ||
		( ( isPublished ||
			isSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty ) ) &&
			! hasNonPostEntityChanges );

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
	return (
		<Button
			{ ...componentProps }
			className={ `${ componentProps.className } editor-post-publish-button__button` }
			size="compact"
		>
			<PublishButtonLabel />
		</Button>
	);
}

/**
 * Renders the publish button.
 */
export default PostPublishButton;
