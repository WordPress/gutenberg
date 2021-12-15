/**
 * External dependencies
 */
import { noop, get, some } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
import { store as editorStore } from '../../store';

export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );
		this.buttonNode = createRef();

		this.createOnClick = this.createOnClick.bind( this );
		this.closeEntitiesSavedStates = this.closeEntitiesSavedStates.bind(
			this
		);

		this.state = {
			entitiesSavedStatesCallback: false,
		};
	}
	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.buttonNode.current.focus();
		}
	}

	createOnClick( callback ) {
		return ( ...args ) => {
			const {
				hasNonPostEntityChanges,
				setEntitiesSavedStatesCallback,
			} = this.props;
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
				some(
					savedEntities,
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
			forceIsSaving,
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
			onSave,
			onStatusChange,
			onSubmit = noop,
			onToggle,
			visibility,
			hasNonPostEntityChanges,
			isSavingNonPostEntityChanges,
		} = this.props;

		const isButtonDisabled =
			( isSaving ||
				forceIsSaving ||
				! isSaveable ||
				isPostSavingLocked ||
				( ! isPublishable && ! forceIsDirty ) ) &&
			( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges );

		const isToggleDisabled =
			( isPublished ||
				isSaving ||
				forceIsSaving ||
				! isSaveable ||
				( ! isPublishable && ! forceIsDirty ) ) &&
			( ! hasNonPostEntityChanges || isSavingNonPostEntityChanges );

		let publishStatus;
		if ( ! hasPublishAction ) {
			publishStatus = 'pending';
		} else if ( visibility === 'private' ) {
			publishStatus = 'private';
		} else if ( isBeingScheduled ) {
			publishStatus = 'future';
		} else {
			publishStatus = 'publish';
		}

		const onClickButton = () => {
			if ( isButtonDisabled ) {
				return;
			}
			onSubmit();
			onStatusChange( publishStatus );
			onSave();
		};

		const onClickToggle = () => {
			if ( isToggleDisabled ) {
				return;
			}
			onToggle();
		};

		const buttonProps = {
			'aria-disabled': isButtonDisabled,
			className: 'editor-post-publish-button',
			isBusy: ! isAutoSaving && isSaving && isPublished,
			variant: 'primary',
			onClick: this.createOnClick( onClickButton ),
		};

		const toggleProps = {
			'aria-disabled': isToggleDisabled,
			'aria-expanded': isOpen,
			className: 'editor-post-publish-panel__toggle',
			isBusy: isSaving && isPublished,
			variant: 'primary',
			onClick: this.createOnClick( onClickToggle ),
		};

		const toggleChildren = isBeingScheduled
			? __( 'Schedule…' )
			: __( 'Publish' );
		const buttonChildren = (
			<PublishButtonLabel
				forceIsSaving={ forceIsSaving }
				hasNonPostEntityChanges={ hasNonPostEntityChanges }
			/>
		);

		const componentProps = isToggle ? toggleProps : buttonProps;
		const componentChildren = isToggle ? toggleChildren : buttonChildren;
		return (
			<>
				<Button
					ref={ this.buttonNode }
					{ ...componentProps }
					className={ classnames(
						componentProps.className,
						'editor-post-publish-button__button',
						{
							'has-changes-dot': hasNonPostEntityChanges,
						}
					) }
				>
					{ componentChildren }
				</Button>
			</>
		);
	}
}

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
		} = select( editorStore );
		const _isAutoSaving = isAutosavingPost();
		return {
			isSaving: isSavingPost() || _isAutoSaving,
			isAutoSaving: _isAutoSaving,
			isBeingScheduled: isEditedPostBeingScheduled(),
			visibility: getEditedPostVisibility(),
			isSaveable: isEditedPostSaveable(),
			isPostSavingLocked: isPostSavingLocked(),
			isPublishable: isEditedPostPublishable(),
			isPublished: isCurrentPostPublished(),
			hasPublishAction: get(
				getCurrentPost(),
				[ '_links', 'wp:action-publish' ],
				false
			),
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			hasNonPostEntityChanges: hasNonPostEntityChanges(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( editorStore );
		return {
			onStatusChange: ( status ) =>
				editPost( { status }, { undoIgnore: true } ),
			onSave: savePost,
		};
	} ),
] )( PostPublishButton );
