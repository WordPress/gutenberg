import type { ReactNode } from 'react';

/**
 * Props of `MediaUploadCheck`.
 */
export interface MediaUploadCheckProps {
	/**
	 * Rendered when the user cannot upload media.
	 */
	fallback?: ReactNode;
	children?: ReactNode;
}

/**
 * Props of `MediaUpload`, implemented through the `editor.MediaUpload` filter.
 */
export interface MediaUploadProps< Media = unknown > {
	/**
	 * The types of the media to upload or select from the media library,
	 * either a general mime type such as 'image' or a complete one such as
	 * 'image/gif'. All mime types are allowed when unset.
	 */
	allowedTypes?: string[];
	/**
	 * The frame content's default mode, such as 'browse' or 'upload'.
	 */
	mode?: string;
	/**
	 * Whether to allow selecting multiple files. `add` allows it without
	 * holding `Shift` or `Ctrl`/`Cmd`.
	 */
	multiple?: boolean | string;
	/**
	 * Media ID, or IDs if `multiple` is set, selected when the library opens.
	 */
	value?: number | number[];
	/**
	 * Called when the media modal closes, with or without a selection.
	 */
	onClose?: () => void;
	/**
	 * Called after `onClose` with the selected media, whose shape comes from
	 * the filter's implementation and is supplied by the caller.
	 */
	onSelect: ( media: Media ) => void;
	/**
	 * Title displayed in the media modal.
	 */
	title?: string;
	/**
	 * CSS class added to the media modal frame.
	 */
	modalClass?: string;
	/**
	 * Whether the gallery modal opens in the media library rather than in
	 * the edit frame. Only applies when `gallery` is set.
	 */
	addToGallery?: boolean;
	/**
	 * Whether to initiate the states representing a gallery.
	 */
	gallery?: boolean;
	/**
	 * Whether the modal opens as the featured image frame.
	 */
	featuredImageFlow?: boolean;
	/**
	 * @deprecated Use `featuredImageFlow` instead.
	 */
	unstableFeaturedImageFlow?: boolean;
	/**
	 * Renders the button opening the media library.
	 */
	render: ( props: { open: () => void } ) => ReactNode;
}
