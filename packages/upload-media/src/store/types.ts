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
	batchId?: string;
	sourceUrl?: string;
	sourceAttachmentId?: number;
	abortController?: AbortController;
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
	PauseItem = 'PAUSE_ITEM',
	ResumeItem = 'RESUME_ITEM',
	PauseQueue = 'PAUSE_QUEUE',
	ResumeQueue = 'RESUME_QUEUE',
	OperationStart = 'OPERATION_START',
	OperationFinish = 'OPERATION_FINISH',
	AddOperations = 'ADD_OPERATIONS',
	CacheBlobUrl = 'CACHE_BLOB_URL',
	RevokeBlobUrls = 'REVOKE_BLOB_URLS',
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

export interface Settings {
	// Function for uploading files to the server.
	mediaUpload: ( args: UploadMediaArgs ) => void;
	// List of allowed mime types and file extensions.
	allowedMimeTypes?: Record< string, string > | null;
	// Maximum upload file size
	maxUploadFileSize?: number;
}

// Must match the Attachment type from the media-utils package.
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
}

export type OnChangeHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnSuccessHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnErrorHandler = ( error: Error ) => void;
export type OnBatchSuccessHandler = () => void;

export enum ItemStatus {
	Processing = 'PROCESSING',
	Paused = 'PAUSED',
}

export enum OperationType {
	Prepare = 'PREPARE',
	Upload = 'UPLOAD',
}

export interface OperationArgs {}

type OperationWithArgs< T extends keyof OperationArgs = keyof OperationArgs > =
	[ T, OperationArgs[ T ] ];

export type Operation = OperationType | OperationWithArgs;

export type AdditionalData = Record< string, unknown >;

export type ImageFormat = 'jpeg' | 'webp' | 'avif' | 'png' | 'gif';
