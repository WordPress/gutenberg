/**
 * External Dependencies
 */
import { get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, IconButton, withSafeTimeout, ifCondition } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import PostSwitchToDraftButton from '../post-switch-to-draft-button';

const { displayShortcut } = keycodes;

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
		const { isNew, isPublished, isDirty, isSaving, isSaveable, onSave, isAutosaving } = this.props;
		const { forceSavedMessage } = this.state;
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

		if ( isPublished ) {
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

		return (
			<IconButton
				className="editor-post-save-draft"
				onClick={ onSave }
				icon="cloud-upload"
				shortcut={ displayShortcut.primary( 's' ) }
			>
				{ __( 'Save Draft' ) }
			</IconButton>
		);
	}
}

export default compose( [
	withSelect( ( select, { forceIsDirty, forceIsSaving } ) => {
		const {
			isEditedPostNew,
			isCurrentPostPublished,
			isEditedPostDirty,
			isSavingPost,
			isEditedPostSaveable,
			getCurrentPost,
			isAutosavingPost,
		} = select( 'core/editor' );
		const { getPostType } = select( 'core' );

		const post = getCurrentPost();

		return {
			post,
			isNew: isEditedPostNew(),
			isPublished: isCurrentPostPublished(),
			isDirty: forceIsDirty || isEditedPostDirty(),
			isSaving: forceIsSaving || isSavingPost(),
			isSaveable: isEditedPostSaveable(),
			isPostSaveable: get( getPostType( post.type ), [ 'saveable' ], true ),
			isAutosaving: isAutosavingPost(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onSave: dispatch( 'core/editor' ).savePost,
	} ) ),
	withSafeTimeout,
	ifCondition( ( { isPostSaveable } ) => isPostSaveable ),
] )( PostSavedState );
