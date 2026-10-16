import type { ComponentProps, KeyboardEventHandler, ReactNode } from 'react';
import type { Dropdown } from '@wordpress/components';
import type { store as noticesStore } from '@wordpress/notices';
import type { ActionCreatorsOf, ConfigOf } from '@wordpress/data';

type NoticesActions = ActionCreatorsOf< ConfigOf< typeof noticesStore > >;

/**
 * Props the replace flow passes to a custom toggle.
 */
export interface MediaReplaceFlowToggleProps {
	'aria-expanded': boolean;
	'aria-haspopup': 'true';
	onClick: () => void;
	onKeyDown: KeyboardEventHandler< HTMLElement >;
	children: ReactNode;
}

/**
 * Props of `MediaReplaceFlow`, except the upload handling.
 */
interface MediaReplaceFlowBaseProps {
	/** The URL of the media. */
	mediaURL: string;
	/** The Id of the attachment post type for the current media. */
	mediaId?: number;
	/** The Ids of the attachments of a gallery. */
	mediaIds?: number[];
	/** A list of media types allowed to replace the current media. */
	allowedTypes: string[];
	/** Comma delimited list of MIME types accepted for upload. */
	accept: string;
	/**
	 * Callback called when an upload error happens and receives an error
	 * message as an argument.
	 */
	onError?: ( message: string ) => void;
	/**
	 * Callback used when media is replaced with an URL. It is called with one
	 * argument `newURL` which is a `string` containing the new URL.
	 */
	onSelectURL?: ( newURL: string ) => void;
	/** Called when the media is reset. */
	onReset?: () => void;
	/** Called when the featured image is toggled. */
	onToggleFeaturedImage?: () => void;
	/** Whether the featured image is used. */
	useFeaturedImage?: boolean;
	/**
	 * Callback called before to start to upload the files. It receives an
	 * array with the files to upload before to the final process.
	 */
	onFilesUpload?: ( files: FileList ) => void;
	/**
	 * A `string` value will be used as the label of the replace button. It
	 * can also accept `Phrasing content` elements(ex. `span`).
	 */
	name?: ReactNode;
	/**
	 * If passed, children are rendered inside the dropdown. If a function is
	 * provided for this prop, it will receive an object with the `onClose`
	 * prop as an argument.
	 */
	children?: ReactNode | ( ( props: { onClose: () => void } ) => ReactNode );
	/** Whether to allow selecting multiple media. */
	multiple?: boolean;
	/** Whether the gallery modal opens in the media library. */
	addToGallery?: boolean;
	/** Variant of the popover. */
	variant?: ComponentProps< typeof Dropdown >[ 'popoverProps' ] extends
		infer P | undefined
		? P extends { variant?: infer V }
			? V
			: never
		: never;
	/** Props of the popover. */
	popoverProps?: ComponentProps< typeof Dropdown >[ 'popoverProps' ];
	/**
	 * If passed, it will be used to render the provided button instead of the
	 * default one. It should accept and pass through `button` props to a
	 * `button` element.
	 */
	renderToggle?: ( props: MediaReplaceFlowToggleProps ) => ReactNode;
	/** Class name of the dropdown. */
	className?: string;
}

/**
 * Props of `MediaReplaceFlow`. The shape of the media comes from the upload
 * and media library implementations and is supplied by the caller.
 */
export type MediaReplaceFlowProps< Media = unknown > =
	MediaReplaceFlowBaseProps &
		(
			| {
					/** Whether to upload selected files. */
					handleUpload?: true;
					/**
					 * Callback used when media is replaced from the Media
					 * Library or when a new media is uploaded.
					 */
					onSelect: ( media: Media ) => void;
			  }
			| {
					/** Whether to upload selected files. */
					handleUpload: boolean;
					/**
					 * Callback used when media is replaced from the Media
					 * Library or when a new media is uploaded, or with the
					 * selected files when they are not uploaded.
					 */
					onSelect: ( media: Media | FileList ) => void;
			  }
		);

/**
 * Props of the component `withDispatch` wraps.
 */
export type MediaReplaceFlowInnerProps = MediaReplaceFlowBaseProps & {
	handleUpload?: boolean;
	onSelect: ( media: unknown ) => void;
	/** Creates a media replace notice. */
	createNotice: NoticesActions[ 'createNotice' ];
	/** Removes a media replace notice. */
	removeNotice: NoticesActions[ 'removeNotice' ];
};
