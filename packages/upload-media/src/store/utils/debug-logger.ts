/**
 * Debug logger for client-side media processing.
 *
 * Provides detailed console logging for tracking the media upload pipeline.
 * Set DEBUG_ENABLED to true to enable logging.
 */

// Set to true to enable debug logging for client-side media processing.
// Keep disabled by default to avoid test failures from unexpected console output.
const DEBUG_ENABLED = false;

// Color codes for different log types.
const COLORS = {
	queue: '#4CAF50', // Green - queue operations
	operation: '#2196F3', // Blue - operation lifecycle
	vips: '#9C27B0', // Purple - VIPS image processing
	upload: '#FF9800', // Orange - upload/sideload operations
	thumbnail: '#00BCD4', // Cyan - thumbnail generation
	error: '#F44336', // Red - errors
	info: '#607D8B', // Gray - general info
	timing: '#795548', // Brown - timing information
} as const;

type LogCategory = keyof typeof COLORS;

interface LogOptions {
	category: LogCategory;
	data?: Record< string, unknown >;
}

interface MeasureOptions {
	measureName: string;
	startTime: number;
	endTime?: number;
	tooltipText?: string;
	properties?: Array< [ string, string ] >;
}

/**
 * Formats bytes into human-readable size.
 *
 * @param bytes Number of bytes.
 * @return Human-readable size string.
 */
function formatBytes( bytes: number ): string {
	if ( bytes === 0 ) {
		return '0 Bytes';
	}
	const k = 1024;
	const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];
	const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	return (
		parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 2 ) ) +
		' ' +
		sizes[ i ]
	);
}

/**
 * Gets a timestamp string for logging.
 */
function getTimestamp(): string {
	return new Date().toISOString().split( 'T' )[ 1 ].slice( 0, -1 );
}

/**
 * Core logging function with styled output.
 *
 * @param message Log message.
 * @param options Log options including category and data.
 */
function log( message: string, options: LogOptions ): void {
	if ( ! DEBUG_ENABLED ) {
		return;
	}

	const { category, data } = options;
	const color = COLORS[ category ];
	const timestamp = getTimestamp();
	const prefix = `[MEDIA:${ category.toUpperCase() }]`;

	// eslint-disable-next-line no-console
	console.log(
		`%c${ timestamp } ${ prefix }%c ${ message }`,
		`color: ${ color }; font-weight: bold;`,
		'color: inherit;'
	);

	if ( data && Object.keys( data ).length > 0 ) {
		// eslint-disable-next-line no-console
		console.log( '%c  └─ Details:', 'color: #888;', data );
	}
}

/**
 * Records a performance measure visible in DevTools Performance panel.
 *
 * Uses the User Timings API (performance.measure) to create entries
 * under a custom "Upload Media" track in DevTools.
 *
 * @param options             Measure options.
 * @param options.measureName Name for the performance measure entry.
 * @param options.startTime   Start time from performance.now().
 * @param options.endTime     End time from performance.now(). Defaults to current time.
 * @param options.tooltipText Tooltip text shown in DevTools.
 * @param options.properties  Key-value pairs shown in DevTools detail view.
 */
export function measure( options: MeasureOptions ): void {
	if ( ! DEBUG_ENABLED ) {
		return;
	}

	const {
		measureName,
		startTime,
		endTime = performance.now(),
		tooltipText,
		properties,
	} = options;

	const detail: Record< string, unknown > = {
		devtools: {
			dataType: 'track-entry',
			track: 'Upload Media',
			tooltipText,
			properties: properties?.map( ( [ key, value ] ) => ( {
				key,
				value,
			} ) ),
		},
	};

	try {
		performance.measure( measureName, {
			start: startTime,
			end: endTime,
			detail,
		} );
	} catch {
		// Silently ignore if User Timings API is unavailable.
	}
}

/**
 * Log when an item is added to the queue.
 *
 * @param itemId   Queue item ID.
 * @param fileName File name.
 * @param fileSize File size in bytes.
 * @param fileType File MIME type.
 * @param batchId  Optional batch ID.
 */
export function logQueueAdd(
	itemId: string,
	fileName: string,
	fileSize: number,
	fileType: string,
	batchId?: string
): void {
	log( `Item added to queue: ${ fileName }`, {
		category: 'queue',
		data: {
			itemId,
			fileName,
			fileSize: formatBytes( fileSize ),
			fileType,
			batchId: batchId || 'none',
		},
	} );
}

/**
 * Log when a sideload item is added to the queue.
 *
 * @param itemId    Queue item ID.
 * @param fileName  File name.
 * @param parentId  Parent item ID.
 * @param imageSize Image size name.
 */
export function logSideloadAdd(
	itemId: string,
	fileName: string,
	parentId: string,
	imageSize: string
): void {
	log( `Sideload item added: ${ fileName } (${ imageSize })`, {
		category: 'thumbnail',
		data: {
			itemId,
			fileName,
			parentId,
			imageSize,
		},
	} );
}

/**
 * Log when an item starts processing.
 *
 * @param itemId   Queue item ID.
 * @param fileName File name.
 */
export function logProcessStart( itemId: string, fileName: string ): void {
	log( `Processing started: ${ fileName }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log when an operation starts.
 *
 * @param itemId    Queue item ID.
 * @param operation Operation name.
 * @param fileName  File name.
 */
export function logOperationStart(
	itemId: string,
	operation: string,
	fileName: string
): void {
	log( `Operation started: ${ operation } on ${ fileName }`, {
		category: 'operation',
		data: { itemId, operation },
	} );
}

/**
 * Log when an operation completes.
 *
 * @param itemId    Queue item ID.
 * @param operation Operation name.
 * @param fileName  File name.
 * @param duration  Duration in milliseconds.
 */
export function logOperationComplete(
	itemId: string,
	operation: string,
	fileName: string,
	duration?: number
): void {
	const durationStr = duration ? ` (${ duration }ms)` : '';
	log(
		`Operation completed: ${ operation } on ${ fileName }${ durationStr }`,
		{
			category: 'operation',
			data: { itemId, operation, durationMs: duration },
		}
	);
}

/**
 * Log when prepare determines operations.
 *
 * @param itemId     Queue item ID.
 * @param fileName   File name.
 * @param operations List of operation names.
 */
export function logPrepareOperations(
	itemId: string,
	fileName: string,
	operations: string[]
): void {
	log( `Prepared operations for ${ fileName }`, {
		category: 'queue',
		data: {
			itemId,
			operations,
			operationCount: operations.length,
		},
	} );
}

/**
 * Log resize/crop operation details.
 *
 * @param itemId        Queue item ID.
 * @param fileName      File name.
 * @param resize        Resize dimensions and crop settings.
 * @param resize.width  Target width.
 * @param resize.height Target height.
 * @param resize.crop   Crop setting.
 * @param isThreshold   Whether this is a big image threshold resize.
 * @param isSubSize     Whether this is a sub-size (thumbnail) resize.
 */
export function logResizeCrop(
	itemId: string,
	fileName: string,
	resize: { width: number; height: number; crop?: boolean | string[] },
	isThreshold: boolean,
	isSubSize: boolean
): void {
	let type = 'Resize/Crop';
	if ( isThreshold ) {
		type = 'Big Image Threshold Resize';
	} else if ( isSubSize ) {
		type = 'Thumbnail Generation';
	}
	log( `${ type }: ${ fileName }`, {
		category: 'vips',
		data: {
			itemId,
			targetWidth: resize.width,
			targetHeight: resize.height,
			crop: resize.crop || false,
			isThreshold,
			isSubSize,
		},
	} );
}

/**
 * Log resize completion with dimensions.
 *
 * @param itemId         Queue item ID.
 * @param fileName       File name.
 * @param originalWidth  Original image width.
 * @param originalHeight Original image height.
 * @param newWidth       New image width.
 * @param newHeight      New image height.
 * @param newFileSize    New file size in bytes.
 */
export function logResizeComplete(
	itemId: string,
	fileName: string,
	originalWidth: number,
	originalHeight: number,
	newWidth: number,
	newHeight: number,
	newFileSize: number
): void {
	const wasResized =
		originalWidth !== newWidth || originalHeight !== newHeight;
	log(
		`Resize completed: ${ fileName } ${ originalWidth }x${ originalHeight } → ${ newWidth }x${ newHeight }`,
		{
			category: 'vips',
			data: {
				itemId,
				originalDimensions: `${ originalWidth }x${ originalHeight }`,
				newDimensions: `${ newWidth }x${ newHeight }`,
				newFileSize: formatBytes( newFileSize ),
				wasResized,
			},
		}
	);
}

/**
 * Log rotation operation.
 *
 * @param itemId      Queue item ID.
 * @param fileName    File name.
 * @param orientation EXIF orientation value.
 */
export function logRotation(
	itemId: string,
	fileName: string,
	orientation: number
): void {
	const orientationNames: Record< number, string > = {
		1: 'Normal',
		2: 'Flipped horizontally',
		3: 'Rotated 180°',
		4: 'Flipped vertically',
		5: 'Rotated 90° CCW + flipped horizontally',
		6: 'Rotated 90° CW',
		7: 'Rotated 90° CW + flipped horizontally',
		8: 'Rotated 90° CCW',
	};
	log( `EXIF Rotation: ${ fileName }`, {
		category: 'vips',
		data: {
			itemId,
			orientation,
			orientationName: orientationNames[ orientation ] || 'Unknown',
		},
	} );
}

/**
 * Log rotation completion.
 *
 * @param itemId    Queue item ID.
 * @param fileName  File name.
 * @param newWidth  New image width after rotation.
 * @param newHeight New image height after rotation.
 */
export function logRotationComplete(
	itemId: string,
	fileName: string,
	newWidth: number,
	newHeight: number
): void {
	log( `Rotation completed: ${ fileName }`, {
		category: 'vips',
		data: {
			itemId,
			newDimensions: `${ newWidth }x${ newHeight }`,
		},
	} );
}

/**
 * Log format transcoding operation.
 *
 * @param itemId       Queue item ID.
 * @param fileName     File name.
 * @param inputFormat  Input image format.
 * @param outputFormat Target output format.
 * @param quality      Output quality (0-1).
 */
export function logTranscode(
	itemId: string,
	fileName: string,
	inputFormat: string,
	outputFormat: string,
	quality: number
): void {
	log( `Transcoding: ${ fileName } (${ inputFormat } → ${ outputFormat })`, {
		category: 'vips',
		data: {
			itemId,
			inputFormat,
			outputFormat,
			quality: Math.round( quality * 100 ) + '%',
		},
	} );
}

/**
 * Log format transcoding completion.
 *
 * @param itemId       Queue item ID.
 * @param fileName     File name.
 * @param outputFormat Output image format.
 * @param inputSize    Input file size in bytes.
 * @param outputSize   Output file size in bytes.
 */
export function logTranscodeComplete(
	itemId: string,
	fileName: string,
	outputFormat: string,
	inputSize: number,
	outputSize: number
): void {
	const savings = Math.round( ( 1 - outputSize / inputSize ) * 100 );
	log( `Transcoding completed: ${ fileName }`, {
		category: 'vips',
		data: {
			itemId,
			outputFormat,
			inputSize: formatBytes( inputSize ),
			outputSize: formatBytes( outputSize ),
			savings: savings > 0 ? `${ savings }%` : 'none',
		},
	} );
}

/**
 * Log upload start.
 *
 * @param itemId   Queue item ID.
 * @param fileName File name.
 * @param fileSize File size in bytes.
 */
export function logUploadStart(
	itemId: string,
	fileName: string,
	fileSize: number
): void {
	log( `Upload started: ${ fileName }`, {
		category: 'upload',
		data: {
			itemId,
			fileSize: formatBytes( fileSize ),
		},
	} );
}

/**
 * Log upload completion.
 *
 * @param itemId       Queue item ID.
 * @param fileName     File name.
 * @param attachmentId WordPress attachment ID.
 * @param url          Attachment URL.
 */
export function logUploadComplete(
	itemId: string,
	fileName: string,
	attachmentId: number | undefined,
	url: string | undefined
): void {
	log( `Upload completed: ${ fileName }`, {
		category: 'upload',
		data: {
			itemId,
			attachmentId,
			url,
		},
	} );
}

/**
 * Log sideload start.
 *
 * @param itemId       Queue item ID.
 * @param fileName     File name.
 * @param attachmentId WordPress attachment ID.
 * @param imageSize    Image size name.
 */
export function logSideloadStart(
	itemId: string,
	fileName: string,
	attachmentId: number,
	imageSize: string
): void {
	log( `Sideload started: ${ fileName } as ${ imageSize }`, {
		category: 'upload',
		data: {
			itemId,
			attachmentId,
			imageSize,
		},
	} );
}

/**
 * Log sideload completion.
 *
 * @param itemId    Queue item ID.
 * @param fileName  File name.
 * @param imageSize Image size name.
 */
export function logSideloadComplete(
	itemId: string,
	fileName: string,
	imageSize: string
): void {
	log( `Sideload completed: ${ fileName } as ${ imageSize }`, {
		category: 'upload',
		data: {
			itemId,
			imageSize,
		},
	} );
}

/**
 * Log thumbnail generation start.
 *
 * @param itemId       Queue item ID.
 * @param fileName     File name.
 * @param missingSizes List of missing image size names.
 */
export function logThumbnailGenerationStart(
	itemId: string,
	fileName: string,
	missingSizes: string[]
): void {
	log( `Thumbnail generation started: ${ fileName }`, {
		category: 'thumbnail',
		data: {
			itemId,
			missingSizes,
			count: missingSizes.length,
		},
	} );
}

/**
 * Log individual thumbnail creation.
 *
 * @param itemId   Queue item ID.
 * @param sizeName Image size name.
 * @param width    Thumbnail width.
 * @param height   Thumbnail height.
 * @param crop     Crop setting.
 */
export function logThumbnailCreate(
	itemId: string,
	sizeName: string,
	width: number,
	height: number,
	crop: boolean | string[]
): void {
	log( `Creating thumbnail: ${ sizeName } (${ width }x${ height })`, {
		category: 'thumbnail',
		data: {
			itemId,
			sizeName,
			width,
			height,
			crop,
		},
	} );
}

/**
 * Log item removal from queue.
 *
 * @param itemId   Queue item ID.
 * @param fileName File name.
 */
export function logQueueRemove( itemId: string, fileName?: string ): void {
	log( `Item removed from queue${ fileName ? `: ${ fileName }` : '' }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log item cancellation.
 *
 * @param itemId   Queue item ID.
 * @param fileName File name.
 * @param error    Error that caused cancellation.
 */
export function logCancel(
	itemId: string,
	fileName: string,
	error: Error | string
): void {
	const errorMessage = error instanceof Error ? error.message : error;
	log( `Item cancelled: ${ fileName }`, {
		category: 'error',
		data: {
			itemId,
			error: errorMessage,
		},
	} );
}

/**
 * Log error.
 *
 * @param context Error context description.
 * @param error   Error object or message.
 * @param itemId  Optional queue item ID.
 */
export function logError(
	context: string,
	error: Error | string,
	itemId?: string
): void {
	const errorMessage = error instanceof Error ? error.message : error;
	log( `Error in ${ context }: ${ errorMessage }`, {
		category: 'error',
		data: {
			itemId,
			error: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		},
	} );
}

/**
 * Log VIPS worker initialization.
 */
export function logVipsInit(): void {
	log( 'VIPS WebAssembly worker initialized', {
		category: 'vips',
	} );
}

/**
 * Log VIPS operation start.
 *
 * @param operation VIPS operation name.
 * @param itemId    Queue item ID.
 * @param inputType Input file type.
 */
export function logVipsOperationStart(
	operation: string,
	itemId: string,
	inputType: string
): void {
	log( `VIPS ${ operation } started`, {
		category: 'vips',
		data: {
			itemId,
			inputType,
		},
	} );
}

/**
 * Log VIPS operation complete.
 *
 * @param operation  VIPS operation name.
 * @param itemId     Queue item ID.
 * @param outputType Output file type.
 */
export function logVipsOperationComplete(
	operation: string,
	itemId: string,
	outputType: string
): void {
	log( `VIPS ${ operation } completed`, {
		category: 'vips',
		data: {
			itemId,
			outputType,
		},
	} );
}

/**
 * Log queue pause.
 *
 * @param reason Optional reason for pausing.
 */
export function logQueuePause( reason?: string ): void {
	log( `Queue paused${ reason ? `: ${ reason }` : '' }`, {
		category: 'queue',
	} );
}

/**
 * Log queue resume.
 */
export function logQueueResume(): void {
	log( 'Queue resumed', {
		category: 'queue',
	} );
}

/**
 * Log item pause (for sideload race condition avoidance).
 *
 * @param itemId Queue item ID.
 * @param reason Reason for pausing.
 */
export function logItemPause( itemId: string, reason: string ): void {
	log( `Item paused: ${ reason }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log item resume.
 *
 * @param itemId Queue item ID.
 */
export function logItemResume( itemId: string ): void {
	log( 'Item resumed', {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log concurrency limit hit.
 *
 * @param itemId        Queue item ID.
 * @param activeCount   Number of active uploads.
 * @param maxConcurrent Maximum concurrent uploads allowed.
 */
export function logConcurrencyLimit(
	itemId: string,
	activeCount: number,
	maxConcurrent: number
): void {
	log( `Concurrency limit reached, queuing upload`, {
		category: 'queue',
		data: {
			itemId,
			activeUploads: activeCount,
			maxConcurrent,
		},
	} );
}

/**
 * Log batch completion.
 *
 * @param batchId Batch ID.
 */
export function logBatchComplete( batchId: string ): void {
	log( `Batch completed`, {
		category: 'queue',
		data: { batchId },
	} );
}

/**
 * Log settings update.
 *
 * @param settings Updated settings object.
 */
export function logSettingsUpdate( settings: Record< string, unknown > ): void {
	log( 'Settings updated', {
		category: 'info',
		data: settings,
	} );
}

/**
 * Log general info message.
 *
 * @param message Log message.
 * @param data    Optional additional data.
 */
export function logInfo(
	message: string,
	data?: Record< string, unknown >
): void {
	log( message, {
		category: 'info',
		data,
	} );
}

/**
 * Log when a retry is scheduled for a failed item.
 *
 * @param itemId     Queue item ID.
 * @param fileName   File name.
 * @param retryCount Current retry attempt number.
 * @param delayMs    Delay before retry in milliseconds.
 */
export function logRetryScheduled(
	itemId: string,
	fileName: string,
	retryCount: number,
	delayMs: number
): void {
	log(
		`Retry scheduled for ${ fileName } (attempt ${ retryCount }) in ${ delayMs }ms`,
		{
			category: 'queue',
			data: { itemId, retryCount, delayMs },
		}
	);
}

/**
 * Log when a retry attempt is being executed.
 *
 * @param itemId     Queue item ID.
 * @param fileName   File name.
 * @param retryCount Current retry attempt number.
 */
export function logRetryExecuting(
	itemId: string,
	fileName: string,
	retryCount: number
): void {
	log( `Executing retry for ${ fileName } (attempt ${ retryCount })`, {
		category: 'queue',
		data: { itemId, retryCount },
	} );
}

/**
 * Log when maximum retries have been exceeded.
 *
 * @param itemId     Queue item ID.
 * @param fileName   File name.
 * @param maxRetries Maximum number of retries allowed.
 * @param error      The error that caused the final failure.
 */
export function logMaxRetriesExceeded(
	itemId: string,
	fileName: string,
	maxRetries: number,
	error: Error
): void {
	log( `Max retries exceeded for ${ fileName }`, {
		category: 'error',
		data: { itemId, maxRetries, error: error.message },
	} );
}
