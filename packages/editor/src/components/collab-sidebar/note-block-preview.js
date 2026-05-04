/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';

export function NoteBlockPreview( { note, blockPreview, blockIcon } ) {
	const textPreview =
		typeof blockPreview?.text === 'string' ? blockPreview.text : null;
	const imagePreviewUrl =
		typeof blockPreview?.url === 'string' ? blockPreview.url : null;
	const hasIcon = !! blockIcon;
	const hasPreview = !! textPreview || !! imagePreviewUrl;
	const shouldShowPreview =
		note.parent === 0 && !! note.blockClientId && ( hasIcon || hasPreview );
	const isImagePreview = !! imagePreviewUrl;

	if ( ! shouldShowPreview ) {
		return null;
	}

	return (
		<div
			className={ clsx(
				'editor-collab-sidebar-panel__note-preview',
				isImagePreview
					? 'editor-collab-sidebar-panel__note-preview-image'
					: 'editor-collab-sidebar-panel__note-preview-content'
			) }
		>
			{ hasIcon && (
				<BlockIcon
					className="editor-collab-sidebar-panel__note-preview-icon"
					icon={ blockIcon }
					showColors={ false }
				/>
			) }
			{ ! isImagePreview && (
				<span className="editor-collab-sidebar-panel__note-preview-text">
					{ textPreview }
				</span>
			) }
			{ isImagePreview && (
				<img
					className="editor-collab-sidebar-panel__note-preview-img"
					src={ imagePreviewUrl }
					alt=""
				/>
			) }
		</div>
	);
}
