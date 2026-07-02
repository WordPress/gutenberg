/**
 * Sub-size data returned by the sideload endpoint.
 *
 * Each sideload returns this lightweight object instead of a full attachment.
 * The client accumulates these and sends them all to the finalize endpoint.
 */
export interface SubSizeData {
	/**
	 * Size name, or an array of names when the same sideloaded file is
	 * registered under multiple sizes that share identical dimensions.
	 */
	image_size: string | string[];
	width?: number;
	height?: number;
	file: string;
	mime_type?: string;
	filesize?: number;
	original_image?: string;
}

export type QueueItemId = string;

export type QueueStatus = 'active' | 'paused';

export type BatchId = string;

export interface QueueItem {
	id: QueueItemId;
	sourceFile: File;
	file: File;
	// Original HEIC/HEIF file, kept separately so it can be sideloaded
	// as the attachment's "original_image" after the converted JPEG is
	// uploaded. Not set for non-HEIC items.
	originalHeicFile?: File;
	// Original animated GIF, kept separately so it can be transcoded to a
	// video and sideloaded as a companion file of the GIF image attachment
	// (recorded in attachment metadata as `animated_video`). Not set for
	// non-animated-GIF items.
	animatedGifFile?: File;
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
	nextRetryTimestamp?: number;
	progress?: number;
	batchId?: string;
	sourceUrl?: string;
	sourceAttachmentId?: number;
	abortController?: AbortController;
	parentId?: QueueItemId;
	subSizes?: SubSizeData[];
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
	ScheduleRetry = 'SCHEDULE_RETRY',
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
	AccumulateSubSize = 'ACCUMULATE_SUB_SIZE',
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
export type ScheduleRetryAction = Action<
	Type.ScheduleRetry,
	{
		id: QueueItemId;
		error: Error;
		retryCount: number;
		nextRetryTimestamp: number;
	}
>;
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
export type AccumulateSubSizeAction = Action<
	Type.AccumulateSubSize,
	{ id: QueueItemId; subSize: SubSizeData }
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
	/** Function called when the sideload completes with sub-size data. */
	onSuccess?: ( subSize: SubSizeData ) => void;
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
	// Default image quality (0-1) for resize/crop operations.
	// Default is 0.82 if not set.
	imageQuality?: number;
	// Function for finalizing an upload after all client-side processing is complete.
	// May return the up-to-date attachment so the queue and block markup can pick
	// up the post-finalize URL (the scaled file), which is required for `srcset`.
	mediaFinalize?: (
		id: number,
		subSizes: SubSizeData[]
	) => Promise< Partial< Attachment > | void >;
	// Whether to convert animated GIFs to video (MP4/WebM) during upload.
	// When enabled, animated GIFs are transcoded to video for smaller file sizes.
	// Default is true.
	gifConvert?: boolean;
	// Output format for GIF-to-video conversion.
	// Accepts 'video/mp4' or 'video/webm'. Default is 'video/mp4'.
	videoOutputFormat?: 'video/mp4' | 'video/webm';
	// Retry settings for automatic retry on failure.
	retry?: RetrySettings;
	// Function for deleting an attachment from the server. Used to clean up
	// the parent attachment when client-side sub-size processing fails after
	// the parent file has already been uploaded.
	mediaDelete?: ( id: number ) => Promise< void >;
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
	poster?: string;
	meta?:
		| []
		| {
				[ k: string ]: unknown;
		  };
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
	/** Output MIME type for format conversion, or null/undefined if no conversion needed. */
	image_output_format?: string | null;
	/** Whether to use progressive/interlaced encoding. */
	image_save_progressive?: boolean;
}

export type OnChangeHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnSuccessHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnErrorHandler = ( error: Error ) => void;
export type OnBatchSuccessHandler = () => void;

export enum ItemStatus {
	Queued = 'QUEUED',
	Processing = 'PROCESSING',
	Paused = 'PAUSED',
	PendingRetry = 'PENDING_RETRY',
	Uploaded = 'UPLOADED',
	Error = 'ERROR',
}

export enum OperationType {
	Prepare = 'PREPARE',
	Upload = 'UPLOAD',
	ResizeCrop = 'RESIZE_CROP',
	Rotate = 'ROTATE',
	TranscodeImage = 'TRANSCODE_IMAGE',
	TranscodeGif = 'TRANSCODE_GIF',
	ThumbnailGeneration = 'THUMBNAIL_GENERATION',
	Finalize = 'FINALIZE',
	// UltraHDR operations
	DetectUltraHdr = 'DETECT_ULTRAHDR',
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
	[ OperationType.TranscodeGif ]: {
		/** Video output format: 'mp4' or 'webm'. */
		outputFormat: 'mp4' | 'webm';
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
	/** The name(s) of the image size being generated (e.g., 'thumbnail', 'medium'). When multiple size names share the same dimensions, an array can be passed to register one file under all names. */
	image_size: string | string[];
}

export type ImageFormat = 'jpeg' | 'webp' | 'avif' | 'png' | 'gif';

/**
 * Configuration for automatic retry behavior on upload failures.
 */
export interface RetrySettings {
	/** Maximum number of retry attempts before giving up. */
	maxRetryAttempts: number;
	/** Initial delay in milliseconds before the first retry. */
	initialRetryDelayMs: number;
	/** Maximum delay in milliseconds (cap for exponential growth). */
	maxRetryDelayMs: number;
	/** Multiplier for exponential backoff (e.g., 2 means double each time). */
	backoffMultiplier: number;
	/** Jitter factor (0-1) to add randomness and prevent thundering herd. */
	retryJitter: number;
}
