/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__unstableGetAnimateClassName as getAnimateClassName,
	Button,
} from '@wordpress/components';
import { usePrevious, useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check, cloud, cloudUpload } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import PostSwitchToDraftButton from '../post-switch-to-draft-button';

/**
 * Component showing whether the post is saved or not and providing save
 * buttons.
 *
 * @param {Object} props               Component props.
 * @param {?boolean} props.forceIsDirty  Whether to force the post to be marked
 * as dirty.
 * @param {?boolean} props.forceIsSaving Whether to force the post to be marked
 * as being saved.
 * @param {?boolean} props.showIconLabels Whether interface buttons show labels instead of icons
 * @return {import('@wordpress/element').WPComponent} The component.
 */
export default function PostSavedState( {
	forceIsDirty,
	forceIsSaving,
	showIconLabels = false,
} ) {
	const [ forceSavedMessage, setForceSavedMessage ] = useState( false );
	const isLargeViewport = useViewportMatch( 'small' );

	const {
		isAutosaving,
		isDirty,
		isNew,
		isPending,
		isPublished,
		isSaveable,
		isSaving,
		isScheduled,
		hasPublishAction,
	} = useSelect(
		( select ) => {
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
				isAutosaving: isAutosavingPost(),
				isDirty: forceIsDirty || isEditedPostDirty(),
				isNew: isEditedPostNew(),
				isPending: 'pending' === getEditedPostAttribute( 'status' ),
				isPublished: isCurrentPostPublished(),
				isSaving: forceIsSaving || isSavingPost(),
				isSaveable: isEditedPostSaveable(),
				isScheduled: isCurrentPostScheduled(),
				hasPublishAction:
					getCurrentPost()?._links?.[ 'wp:action-publish' ] ?? false,
			};
		},
		[ forceIsDirty, forceIsSaving ]
	);

	const { savePost } = useDispatch( 'core/editor' );

	const wasSaving = usePrevious( isSaving );

	useEffect( () => {
		let timeoutId;

		if ( wasSaving && ! isSaving ) {
			setForceSavedMessage( true );
			timeoutId = setTimeout( () => {
				setForceSavedMessage( false );
			}, 1000 );
		}

		return () => clearTimeout( timeoutId );
	}, [ isSaving ] );

	if ( isSaving ) {
		// TODO: Classes generation should be common across all return
		// paths of this function, including proper naming convention for
		// the "Save Draft" button.
		const classes = classnames(
			'editor-post-saved-state',
			'is-saving',
			getAnimateClassName( { type: 'loading' } ),
			{
				'is-autosaving': isAutosaving,
			}
		);

		return (
			<span className={ classes }>
				<Icon icon={ cloud } />
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
				<Icon icon={ check } />
				{ __( 'Saved' ) }
			</span>
		);
	}

	// Once the post has been submitted for review this button
	// is not needed for the contributor role.

	if ( ! hasPublishAction && isPending ) {
		return null;
	}

	/* translators: button label text should, if possible, be under 16 characters. */
	const label = isPending ? __( 'Save as pending' ) : __( 'Save draft' );

	/* translators: button label text should, if possible, be under 16 characters. */
	const shortLabel = __( 'Save' );

	if ( ! isLargeViewport ) {
		return (
			<Button
				className="editor-post-save-draft"
				label={ label }
				onClick={ () => savePost() }
				shortcut={ displayShortcut.primary( 's' ) }
				icon={ cloudUpload }
			>
				{ showIconLabels && shortLabel }
			</Button>
		);
	}

	return (
		<Button
			className="editor-post-save-draft"
			onClick={ () => savePost() }
			shortcut={ displayShortcut.primary( 's' ) }
			variant="tertiary"
		>
			{ label }
		</Button>
	);
}
