/**
 * External dependencies
 */
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { withSafeTimeout, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostSwitchToDraftButton from '../post-switch-to-draft-button';

/**
 * Component showing whether the post is saved or not and displaying save links.
 *
 * @param   {Object}    Props Component Props.
 */
export class PostSavedState extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			forceSavedMessage: false,
		};
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.isSaving && ! this.props.isSaving ) {
			this.setState( { forceSavedMessage: true } );
			this.props.setTimeout( () => {
				this.setState( { forceSavedMessage: false } );
			}, 1000 );
		}
	}

	render() {
		const { post, isNew, isScheduled, isPublished, isDirty, isSaving, isSaveable, onSave, isAutosaving, isPending } = this.props;
		const { forceSavedMessage } = this.state;
		const hasPublishAction = get( post, [ '_links', 'wp:action-publish' ], false );
		if ( isSaving ) {
			// TODO: Classes generation should be common across all return
			// paths of this function, including proper naming convention for
			// the "Save Draft" button.
			const classes = classnames( 'editor-post-saved-state', 'is-saving', {
				'is-autosaving': isAutosaving,
			} );

			return (
				<span className={ classes }>
					<Dashicon icon="cloud" />
					{ isAutosaving ? __( 'Autosaving' ) : __( 'Saving' ) }
				</span>
			);
		}

		if ( isPublished || isScheduled ) {
			return <PostSwitchToDraftButton />;
		}

		if ( ! isSaveable ) {
			return null;
		}

		if ( forceSavedMessage || ( ! isNew && ! isDirty ) ) {
			return (
				<span className="editor-post-saved-state is-saved">
					<Dashicon icon="saved" />
					{ __( 'Saved' ) }
				</span>
			);
		}

		// Once the post has been submitted for review this button
		// is not needed for the contributor role.
		if ( ! hasPublishAction && isPending ) {
			return null;
		}

		return (
			<IconButton
				className="editor-post-save-draft"
				onClick={ onSave }
				icon="cloud-upload"
				shortcut={ displayShortcut.primary( 's' ) }
			>
				{ isPending ? __( 'Save as Pending' ) : __( 'Save Draft' ) }
			</IconButton>
		);
	}
}

export default compose( [
	withSelect( ( select, { forceIsDirty, forceIsSaving } ) => {
		const {
			isEditedPostNew,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostDirty,
			isSavingPost,
			isEditedPostSaveable,
			getCurrentPost,
			isAutosavingPost,
			getEditedPostAttribute,
		} = select( 'core/editor' );
		return {
			post: getCurrentPost(),
			isNew: isEditedPostNew(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isDirty: forceIsDirty || isEditedPostDirty(),
			isSaving: forceIsSaving || isSavingPost(),
			isSaveable: isEditedPostSaveable(),
			isAutosaving: isAutosavingPost(),
			isPending: 'pending' === getEditedPostAttribute( 'status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onSave: dispatch( 'core/editor' ).savePost,
	} ) ),
	withSafeTimeout,
] )( PostSavedState );
