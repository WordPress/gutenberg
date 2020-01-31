/**
 * External dependencies
 */
import { noop, get } from 'lodash';
import classnames from 'classnames';
import memoize from 'memize';
import EquivalentKeyMap from 'equivalent-key-map';

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
import EntitiesSavedStates from '../entities-saved-states';
import PublishButtonLabel from './label';

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
		this.createIgnoredForSave = memoize(
			( postType, postId ) =>
				new EquivalentKeyMap( [
					[ [ 'postType', postType, String( postId ) ], true ],
				] ),
			{ maxSize: 1 }
		);
	}
	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.buttonNode.current.focus();
		}
	}

	createOnClick( callback ) {
		return ( ...args ) => {
			const { hasNonPostEntityChanges } = this.props;
			if ( hasNonPostEntityChanges ) {
				// The modal for multiple entity saving will open,
				// hold the callback for saving/publishing the post
				// so that we can call it if the post entity is checked.
				this.setState( {
					entitiesSavedStatesCallback: () => callback( ...args ),
				} );
				return noop;
			}

			return callback( ...args );
		};
	}

	closeEntitiesSavedStates( savedById ) {
		const { postType, postId } = this.props;
		const { entitiesSavedStatesCallback } = this.state;
		this.setState( { entitiesSavedStatesCallback: false }, () => {
			if (
				savedById &&
				savedById.has( [ 'postType', postType, String( postId ) ] )
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
			isToggle,
			onSave,
			onStatusChange,
			onSubmit = noop,
			onToggle,
			visibility,
			hasNonPostEntityChanges,
			postType,
			postId,
		} = this.props;
		const { entitiesSavedStatesCallback } = this.state;

		const isButtonDisabled =
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			isPostSavingLocked ||
			( ! isPublishable && ! forceIsDirty );

		const isToggleDisabled =
			isPublished ||
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty );

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
			'aria-disabled': isButtonDisabled && ! hasNonPostEntityChanges,
			className: 'editor-post-publish-button',
			isBusy: isSaving && isPublished,
			isPrimary: true,
			onClick: this.createOnClick( onClickButton ),
		};

		const toggleProps = {
			'aria-disabled': isToggleDisabled && ! hasNonPostEntityChanges,
			'aria-expanded': isOpen,
			className: 'editor-post-publish-panel__toggle',
			isBusy: isSaving && isPublished,
			isPrimary: true,
			onClick: this.createOnClick( onClickToggle ),
		};

		const toggleChildren = isBeingScheduled
			? __( 'Schedule…' )
			: __( 'Publish…' );
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
				<EntitiesSavedStates
					isOpen={ Boolean( entitiesSavedStatesCallback ) }
					onRequestClose={ this.closeEntitiesSavedStates }
					ignoredForSave={ this.createIgnoredForSave(
						postType,
						postId
					) }
				/>
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
		} = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
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
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( 'core/editor' );
		return {
			onStatusChange: ( status ) =>
				editPost( { status }, { undoIgnore: true } ),
			onSave: savePost,
		};
	} ),
] )( PostPublishButton );
