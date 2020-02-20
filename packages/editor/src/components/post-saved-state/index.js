/**
 * External dependencies
 */
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Animate, Dashicon, Button } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { withSafeTimeout, compose } from '@wordpress/compose';
import { withViewportMatch } from '@wordpress/viewport';
import { Icon, check } from '@wordpress/icons';

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
		const {
			post,
			isNew,
			isScheduled,
			isPublished,
			isDirty,
			isSaving,
			isSaveable,
			onSave,
			isAutosaving,
			isPending,
			isLargeViewport,
		} = this.props;
		const { forceSavedMessage } = this.state;
		if ( isSaving ) {
			// TODO: Classes generation should be common across all return
			// paths of this function, including proper naming convention for
			// the "Save Draft" button.
			const classes = classnames(
				'editor-post-saved-state',
				'is-saving',
				{
					'is-autosaving': isAutosaving,
				}
			);

			return (
				<Animate type="loading">
					{ ( { className: animateClassName } ) => (
						<span
							className={ classnames(
								classes,
								animateClassName
							) }
						>
							<Dashicon icon="cloud" />
							{ isAutosaving
								? __( 'Autosaving' )
								: __( 'Saving' ) }
						</span>
					) }
				</Animate>
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
					<Icon icon={ check } />
					{ __( 'Saved' ) }
				</span>
			);
		}

		// Once the post has been submitted for review this button
		// is not needed for the contributor role.
		const hasPublishAction = get(
			post,
			[ '_links', 'wp:action-publish' ],
			false
		);
		if ( ! hasPublishAction && isPending ) {
			return null;
		}

		const label = isPending ? __( 'Save as Pending' ) : __( 'Save Draft' );
		if ( ! isLargeViewport ) {
			return (
				<Button
					className="editor-post-save-draft"
					label={ label }
					onClick={ () => onSave() }
					shortcut={ displayShortcut.primary( 's' ) }
					icon="cloud-upload"
				/>
			);
		}

		return (
			<Button
				className="editor-post-save-draft"
				onClick={ () => onSave() }
				shortcut={ displayShortcut.primary( 's' ) }
				isTertiary
			>
				{ label }
			</Button>
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
	withViewportMatch( { isLargeViewport: 'small' } ),
] )( PostSavedState );
