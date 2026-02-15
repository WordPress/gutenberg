export type QueueItemId = string;

export type QueueStatus = 'active' | 'paused';

export type BatchId = string;

export interface QueueItem {
	id: QueueItemId;
	sourceFile: File;
	file: File;
	poster?: File;
	attachment?: Partial< Attachment >;
	status: ItemStatus;
	additionalData: AdditionalData;
	onChange?: OnChangeHandler;
	onSuccess?: OnSuccessHandler;
	onError?: OnErrorHandler;
	onBatchSuccess?: OnBatchSuccessHandler;
	currentOperation?: OperationType;
	operations?: Operation[];
	error?: Error;
	retryCount?: number;
	progress?: number;
	batchId?: string;
	sourceUrl?: string;
	sourceAttachmentId?: number;
	abortController?: AbortController;
	parentId?: QueueItemId;
}

export interface State {
	queue: QueueItem[];
	queueStatus: QueueStatus;
	blobUrls: Record< QueueItemId, string[] >;
	settings: Settings;
}

export enum Type {
	Unknown = 'REDUX_UNKNOWN',
	Add = 'ADD_ITEM',
	Prepare = 'PREPARE_ITEM',
	Cancel = 'CANCEL_ITEM',
	Remove = 'REMOVE_ITEM',
	RetryItem = 'RETRY_ITEM',
	PauseItem = 'PAUSE_ITEM',
	ResumeItem = 'RESUME_ITEM',
	PauseQueue = 'PAUSE_QUEUE',
	ResumeQueue = 'RESUME_QUEUE',
	OperationStart = 'OPERATION_START',
	OperationFinish = 'OPERATION_FINISH',
	AddOperations = 'ADD_OPERATIONS',
	CacheBlobUrl = 'CACHE_BLOB_URL',
	RevokeBlobUrls = 'REVOKE_BLOB_URLS',
	UpdateProgress = 'UPDATE_PROGRESS',
	UpdateSettings = 'UPDATE_SETTINGS',
}

type Action< T = Type, Payload = Record< string, unknown > > = {
	type: T;
} & Payload;

export type UnknownAction = Action< Type.Unknown >;
export type AddAction = Action<
	Type.Add,
	{
		item: Omit< QueueItem, 'operations' > &
			Partial< Pick< QueueItem, 'operations' > >;
	}
>;
export type OperationStartAction = Action<
	Type.OperationStart,
	{ id: QueueItemId; operation: OperationType }
>;
export type OperationFinishAction = Action<
	Type.OperationFinish,
	{
		id: QueueItemId;
		item: Partial< QueueItem >;
	}
>;
export type AddOperationsAction = Action<
	Type.AddOperations,
	{ id: QueueItemId; operations: Operation[] }
>;
export type CancelAction = Action<
	Type.Cancel,
	{ id: QueueItemId; error: Error }
>;
export type RetryItemAction = Action< Type.RetryItem, { id: QueueItemId } >;
export type PauseItemAction = Action< Type.PauseItem, { id: QueueItemId } >;
export type ResumeItemAction = Action< Type.ResumeItem, { id: QueueItemId } >;
export type PauseQueueAction = Action< Type.PauseQueue >;
export type ResumeQueueAction = Action< Type.ResumeQueue >;
export type RemoveAction = Action< Type.Remove, { id: QueueItemId } >;
export type CacheBlobUrlAction = Action<
	Type.CacheBlobUrl,
	{ id: QueueItemId; blobUrl: string }
>;
export type RevokeBlobUrlsAction = Action<
	Type.RevokeBlobUrls,
	{ id: QueueItemId }
>;
export type UpdateProgressAction = Action<
	Type.UpdateProgress,
	{ id: QueueItemId; progress: number }
>;
export type UpdateSettingsAction = Action<
	Type.UpdateSettings,
	{ settings: Partial< Settings > }
>;

interface UploadMediaArgs {
	// Additional data to include in the request.
	additionalData?: AdditionalData;
	// Array with the types of media that can be uploaded, if unset all types are allowed.
	allowedTypes?: string[];
	// List of files.
	filesList: File[];
	// Maximum upload size in bytes allowed for the site.
	maxUploadFileSize?: number;
	// Function called when an error happens.
	onError?: OnErrorHandler;
	// Function called each time a file or a temporary representation of the file is available.
	onFileChange?: OnChangeHandler;
	// Function called once a file has completely finished uploading, including thumbnails.
	onSuccess?: OnSuccessHandler;
	// List of allowed mime types and file extensions.
	wpAllowedMimeTypes?: Record< string, string > | null;
	// Abort signal.
	signal?: AbortSignal;
}

/**
 * Arguments for sideloading a file to an existing attachment.
 *
 * Sideloading adds additional image sizes (thumbnails) to an already
 * uploaded attachment without creating a new attachment.
 */
export interface SideloadMediaArgs {
	/** File to sideload (typically a resized version of the original). */
	file: File;
	/** Attachment ID to add the sideloaded file to. */
	attachmentId: number;
	/** Additional data to include in the request. */
	additionalData?: AdditionalData;
	/** Function called when an error happens. */
	onError?: OnErrorHandler;
	/** Function called when the file or a temporary representation is available. */
	onFileChange?: OnChangeHandler;
	/** Abort signal to cancel the sideload operation. */
	signal?: AbortSignal;
}

export interface Settings {
	// Registered image sizes from the server.
	allImageSizes?: Record< string, ImageSizeCrop >;
	// Function for uploading files to the server.
	mediaUpload: ( args: UploadMediaArgs ) => void;
	// Function for sideloading files to existing attachments.
	mediaSideload?: ( args: SideloadMediaArgs ) => void;
	// List of allowed mime types and file extensions.
	allowedMimeTypes?: Record< string, string > | null;
	// Maximum upload file size.
	maxUploadFileSize?: number;
	// Maximum number of concurrent uploads.
	maxConcurrentUploads: number;
	// Maximum number of concurrent image processing operations (resize, crop, rotate).
	maxConcurrentImageProcessing: number;
	// Big image size threshold in pixels.
	// Images larger than this will be scaled down.
	// Default is 2560 (matching WordPress core).
	bigImageSizeThreshold?: number;
	// Map of source MIME types to output MIME types for transcoding.
	imageOutputFormats?: Record< string, string >;
	// Whether to use progressive/interlaced encoding for JPEG.
	jpegInterlaced?: boolean;
	// Whether to use interlaced encoding for PNG.
	pngInterlaced?: boolean;
	// Whether to use interlaced encoding for GIF.
	gifInterlaced?: boolean;
}

// Matches the Attachment type from the media-utils package.
export interface Attachment {
	id: number;
	alt: string;
	caption: string;
	title: string;
	url: string;
	filename: string | null;
	filesize: number | null;
	media_type: 'image' | 'file';
	mime_type: string;
	featured_media?: number;
	missing_image_sizes?: string[];
	media_filename?: string;
	poster?: string;
	/**
	 * EXIF orientation value from the original image.
	 * Values 1-8 follow the EXIF specification.
	 * A value other than 1 indicates the image needs rotation.
	 *
	 * Orientation values:
	 * 1 = Normal (no rotation needed)
	 * 2 = Flipped horizontally
	 * 3 = Rotated 180°
	 * 4 = Flipped vertically
	 * 5 = Rotated 90° CCW and flipped horizontally
	 * 6 = Rotated 90° CW
	 * 7 = Rotated 90° CW and flipped horizontally
	 * 8 = Rotated 90° CCW
	 */
	exif_orientation?: number;
}

export type OnChangeHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnSuccessHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnErrorHandler = ( error: Error ) => void;
export type OnBatchSuccessHandler = () => void;

export enum ItemStatus {
	Queued = 'QUEUED',
	Processing = 'PROCESSING',
	Paused = 'PAUSED',
	Uploaded = 'UPLOADED',
	Error = 'ERROR',
}

export enum OperationType {
	Prepare = 'PREPARE',
	Upload = 'UPLOAD',
	ResizeCrop = 'RESIZE_CROP',
	Rotate = 'ROTATE',
	TranscodeImage = 'TRANSCODE_IMAGE',
	ThumbnailGeneration = 'THUMBNAIL_GENERATION',
}

/**
 * Defines the dimensions and cropping behavior for an image size.
 */
export interface ImageSizeCrop {
	/** Target width in pixels. */
	width: number;
	/** Target height in pixels. */
	height: number;
	/**
	 * Crop behavior.
	 * - `true` for hard crop centered.
	 * - Positional array like `['left', 'top']` for specific crop anchor.
	 * - `false` or undefined for soft proportional resize.
	 */
	crop?:
		| boolean
		| [ 'left' | 'center' | 'right', 'top' | 'center' | 'bottom' ];
	/** Size name identifier (e.g., 'thumbnail', 'medium'). */
	name?: string;
}

export interface OperationArgs {
	[ OperationType.ResizeCrop ]: {
		resize: ImageSizeCrop;
		/**
		 * Whether this resize is for the big image size threshold.
		 * If true, uses '-scaled' suffix instead of dimension suffix.
		 */
		isThresholdResize?: boolean;
	};
	[ OperationType.Rotate ]: {
		/**
		 * EXIF orientation value (1-8) indicating the required rotation.
		 * Used to apply the correct rotation/flip transformation.
		 */
		orientation: number;
	};
	[ OperationType.TranscodeImage ]: {
		/** Target output format. */
		outputFormat: ImageFormat;
		/** Quality setting (0-1). */
		outputQuality: number;
		/** Whether to use interlaced encoding. */
		interlaced: boolean;
	};
}

type OperationWithArgs< T extends keyof OperationArgs = keyof OperationArgs > =
	[ T, OperationArgs[ T ] ];

export type Operation = OperationType | OperationWithArgs;

export type AdditionalData = Record< string, unknown >;

/**
 * Additional data specific to sideload operations.
 *
 * This extends the base AdditionalData with fields required for
 * sideloading image sizes to an existing attachment.
 */
export interface SideloadAdditionalData extends AdditionalData {
	/** The attachment ID to add the image size to. */
	post: number;
	/** The name of the image size being generated (e.g., 'thumbnail', 'medium'). */
	image_size: string;
}

export type ImageFormat = 'jpeg' | 'webp' | 'avif' | 'png' | 'gif';
