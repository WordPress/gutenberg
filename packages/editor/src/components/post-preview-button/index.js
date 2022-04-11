/**
 * External dependencies
 */
import { get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostPreviewButton( {
	className,
	textContent,
	forceIsAutosaveable,
	forcePreviewLink,
	role,
	onPreview,
} ) {
	const {
		postId,
		currentPostLink,
		previewLink,
		isSaveable,
		isViewable,
	} = useSelect(
		( select ) => {
			const {
				getCurrentPostId,
				getCurrentPostAttribute,
				getEditedPostAttribute,
				isEditedPostSaveable,
				getEditedPostPreviewLink,
			} = select( editorStore );
			const { getPostType } = select( coreStore );

			const postType = getPostType( getEditedPostAttribute( 'type' ) );

			return {
				postId: getCurrentPostId(),
				currentPostLink: getCurrentPostAttribute( 'link' ),
				previewLink:
					forcePreviewLink !== undefined
						? forcePreviewLink
						: getEditedPostPreviewLink(),
				isSaveable: isEditedPostSaveable(),
				isViewable: get( postType, [ 'viewable' ], false ),
			};
		},
		[ forcePreviewLink ]
	);
	const targetId = `wp-preview-${ postId }`;
	const { __unstableTriggerExternalPreview } = useDispatch( editorStore );

	if ( ! isViewable ) {
		return null;
	}

	const openPreviewWindow = ( event ) => {
		// Our Preview button has its 'href' and 'target' set correctly for a11y
		// purposes. Unfortunately, though, we can't rely on the default 'click'
		// handler since sometimes it incorrectly opens a new tab instead of reusing
		// the existing one.
		// https://github.com/WordPress/gutenberg/pull/8330
		event.preventDefault();
		__unstableTriggerExternalPreview( {
			targetId,
			forcePreviewLink,
			forceAutosave: forceIsAutosaveable,
		} );
		if ( onPreview ) {
			onPreview();
		}
	};

	// Link to the `?preview=true` URL if we have it, since this lets us see
	// changes that were autosaved since the post was last published. Otherwise,
	// just link to the post's URL.
	const href = previewLink || currentPostLink;

	const classNames = classnames(
		{
			'editor-post-preview': ! className,
		},
		className
	);

	return (
		<Button
			variant={ ! className ? 'tertiary' : undefined }
			className={ classNames }
			href={ href }
			target={ targetId }
			disabled={ ! isSaveable }
			onClick={ openPreviewWindow }
			role={ role }
		>
			{ !! textContent ? (
				textContent
			) : (
				<>
					{ _x( 'Preview', 'imperative verb' ) }
					<VisuallyHidden as="span">
						{
							/* translators: accessibility text */
							__( '(opens in a new tab)' )
						}
					</VisuallyHidden>
				</>
			) }
		</Button>
	);
}

export default PostPreviewButton;
