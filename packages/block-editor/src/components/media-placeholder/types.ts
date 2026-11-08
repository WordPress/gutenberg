import type {
	ComponentProps,
	CSSProperties,
	FormEventHandler,
	MouseEventHandler,
	ReactNode,
} from 'react';
import type { Placeholder } from '@wordpress/components';

/**
 * A media item the placeholder shows or a gallery adds to.
 */
export interface MediaPlaceholderMedia {
	id?: number;
	url?: string;
	src?: string;
}

/**
 * Props of `MediaPlaceholder`, except the upload handling.
 */
interface MediaPlaceholderBaseProps<
	Value extends MediaPlaceholderMedia = MediaPlaceholderMedia,
> {
	/**
	 * Media item, or items of a gallery, selected when the library opens.
	 */
	value?: Value | Value[];
	/**
	 * Media types to allow, either a general mime type such as 'image' or a
	 * complete one such as 'image/gif'. All are allowed when unset.
	 */
	allowedTypes?: string[];
	className?: string;
	icon?: ComponentProps< typeof Placeholder >[ 'icon' ];
	/**
	 * The title and instructions of the placeholder.
	 */
	labels?: { title?: string; instructions?: string };
	/**
	 * Rendered as the preview of the media.
	 */
	mediaPreview?: ReactNode;
	notices?: ReactNode;
	/**
	 * Whether the placeholder adds to existing media.
	 */
	isAppender?: boolean;
	/**
	 * The `accept` attribute of the file input.
	 */
	accept?: string;
	/**
	 * Whether a gallery opens in the media library.
	 */
	addToGallery?: boolean;
	/**
	 * Whether to allow selecting multiple files. `add` allows it without
	 * holding `Shift` or `Ctrl`/`Cmd`.
	 */
	multiple?: boolean | 'add';
	disableDropZone?: boolean;
	/**
	 * Whether to only render the drop zone UI.
	 */
	dropZoneUIOnly?: boolean;
	disableMediaButtons?: boolean;
	onError?: ( message: string ) => void;
	onCancel?: () => void;
	/**
	 * Called with a URL inserted from the URL input.
	 */
	onSelectURL?: ( url: string ) => void;
	onToggleFeaturedImage?: () => void;
	onDoubleClick?: MouseEventHandler< HTMLDivElement >;
	/**
	 * Called with the files before they are uploaded.
	 */
	onFilesPreUpload?: ( files: ArrayLike< File > ) => void;
	/**
	 * @deprecated
	 */
	onHTMLDrop?: unknown;
	children?: ReactNode;
	/**
	 * Renders the button opening the media library.
	 */
	mediaLibraryButton?: ( props: { open: () => void } ) => ReactNode;
	/**
	 * Renders the placeholder around its content.
	 */
	placeholder?: ( content: ReactNode ) => ReactNode;
	style?: CSSProperties;
}

/**
 * Props of `MediaPlaceholder`. The shape of the media comes from the upload
 * and media library implementations and is supplied by the caller.
 */
export type MediaPlaceholderProps<
	Media = unknown,
	Value extends MediaPlaceholderMedia = MediaPlaceholderMedia,
> = MediaPlaceholderBaseProps< Value > &
	(
		| {
				/**
				 * Whether to upload selected files.
				 */
				handleUpload?: true;
				/**
				 * Called with the selected or uploaded media.
				 */
				onSelect: ( media: Media ) => void;
		  }
		| {
				/**
				 * Whether to upload selected files, or a function that
				 * decides it.
				 */
				handleUpload:
					boolean | ( ( files: ArrayLike< File > ) => boolean );
				/**
				 * Called with the selected or uploaded media, or with the
				 * selected files when they are not uploaded.
				 */
				onSelect: ( media: Media | ArrayLike< File > ) => void;
		  }
	);

/**
 * Props of the popover inserting media from a URL.
 */
export interface InsertFromURLPopoverProps {
	src: string | undefined;
	onChange: ( value?: string ) => void;
	onSubmit: FormEventHandler< HTMLFormElement >;
	onClose: () => void;
	popoverAnchor: HTMLElement | null;
}

/**
 * Props of the UI inserting media from a URL.
 */
export interface URLSelectionUIProps {
	src: string | undefined;
	onChangeSrc: ( value?: string ) => void;
	onSelectURL?: ( url: string ) => void;
}
