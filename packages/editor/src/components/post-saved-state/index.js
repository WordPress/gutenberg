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
import { store as editorStore } from '../../store';

/**
 * Component showing whether the post is saved or not and providing save
 * buttons.
 *
 * @param {Object}   props                Component props.
 * @param {?boolean} props.forceIsDirty   Whether to force the post to be marked
 *                                        as dirty.
 * @param {?boolean} props.forceIsSaving  Whether to force the post to be marked
 *                                        as being saved.
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
			} = select( editorStore );

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

	const { savePost } = useDispatch( editorStore );

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

	// Once the post has been submitted for review this button
	// is not needed for the contributor role.
	if ( ! hasPublishAction && isPending ) {
		return null;
	}

	if ( isPublished || isScheduled ) {
		return <PostSwitchToDraftButton />;
	}

	/* translators: button label text should, if possible, be under 16 characters. */
	const label = isPending ? __( 'Save as pending' ) : __( 'Save draft' );

	/* translators: button label text should, if possible, be under 16 characters. */
	const shortLabel = __( 'Save' );

	const isSaved = forceSavedMessage || ( ! isNew && ! isDirty );
	const isSavedState = isSaving || isSaved;
	const isDisabled = isSaving || isSaved || ! isSaveable;

	let text;

	if ( isSaving ) {
		text = isAutosaving ? __( 'Autosaving' ) : __( 'Saving' );
	} else if ( isSaved ) {
		text = __( 'Saved' );
	} else if ( isLargeViewport ) {
		text = label;
	} else if ( showIconLabels ) {
		text = shortLabel;
	}

	// Use common Button instance for all saved states so that focus is not
	// lost.
	return (
		<Button
			className={
				isSaveable || isSaving
					? classnames( {
							'editor-post-save-draft': ! isSavedState,
							'editor-post-saved-state': isSavedState,
							'is-saving': isSaving,
							'is-autosaving': isAutosaving,
							'is-saved': isSaved,
							[ getAnimateClassName( {
								type: 'loading',
							} ) ]: isSaving,
					  } )
					: undefined
			}
			onClick={ isDisabled ? undefined : () => savePost() }
			shortcut={ displayShortcut.primary( 's' ) }
			variant={ isLargeViewport ? 'tertiary' : undefined }
			icon={ isLargeViewport ? undefined : cloudUpload }
			label={ showIconLabels ? undefined : label }
			aria-disabled={ isDisabled }
		>
			{ isSavedState && <Icon icon={ isSaved ? check : cloud } /> }
			{ text }
		</Button>
	);
}
