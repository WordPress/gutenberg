/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const noop = () => {};

export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );
		this.buttonNode = createRef();

		this.createOnClick = this.createOnClick.bind( this );
		this.closeEntitiesSavedStates =
			this.closeEntitiesSavedStates.bind( this );

		this.state = {
			entitiesSavedStatesCallback: false,
		};
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			// This timeout is necessary to make sure the `useEffect` hook of
			// `useFocusReturn` gets the correct element (the button that opens the
			// PostPublishPanel) otherwise it will get this button.
			this.timeoutID = setTimeout( () => {
				this.buttonNode.current.focus();
			}, 0 );
		}
	}

	componentWillUnmount() {
		clearTimeout( this.timeoutID );
	}

	createOnClick( callback ) {
		return ( ...args ) => {
			const {
				hasNonPostEntityChanges,
				hasPostMetaChanges,
				setEntitiesSavedStatesCallback,
				isPublished,
			} = this.props;
			// If a post with non-post entities is published, but the user
			// elects to not save changes to the non-post entities, those
			// entities will still be dirty when the Publish button is clicked.
			// We also need to check that the `setEntitiesSavedStatesCallback`
			// prop was passed. See https://github.com/WordPress/gutenberg/pull/37383
			//
			// TODO: Explore how to manage `hasPostMetaChanges` and pre-publish workflow properly.
			if (
				( hasNonPostEntityChanges ||
					( hasPostMetaChanges && isPublished ) ) &&
				setEntitiesSavedStatesCallback
			) {
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
		} = this.props;

		const isButtonDisabled =
			( isSaving ||
				! isSaveable ||
				isPostSavingLocked ||
				( ! isPublishable && ! forceIsDirty ) ) &&
			( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges );

		const isToggleDisabled =
			( isPublished ||
				isSaving ||
				! isSaveable ||
				( ! isPublishable && ! forceIsDirty ) ) &&
			( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges );

		// If the new status has not changed explicitely, we derive it from
		// other factors, like having a publish action, etc.. We need to preserve
		// this because it affects when to show the pre and post publish panels.
		// If it has changed though explicitely, we need to respect that.
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
			onClick: this.createOnClick( onClickButton ),
		};

		const toggleProps = {
			'aria-disabled': isToggleDisabled,
			'aria-expanded': isOpen,
			className: 'editor-post-publish-panel__toggle',
			isBusy: isSaving && isPublished,
			variant: 'primary',
			size: 'compact',
			onClick: this.createOnClick( onClickToggle ),
		};
		const componentProps = isToggle ? toggleProps : buttonProps;
		return (
			<>
				<Button
					ref={ this.buttonNode }
					{ ...componentProps }
					className={ `${ componentProps.className } editor-post-publish-button__button` }
					size="compact"
				>
					<PublishButtonLabel />
				</Button>
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
			hasPostMetaChanges,
		} = unlock( select( editorStore ) );
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
			hasPostMetaChanges: hasPostMetaChanges(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( editorStore );
		return {
			savePostStatus: ( status ) => {
				editPost( { status }, { undoIgnore: true } );
				savePost();
			},
		};
	} ),
] )( PostPublishButton );
