/**
 * Debug logger for client-side media processing.
 *
 * Provides detailed console logging for tracking the media upload pipeline.
 * Set DEBUG_ENABLED to true to enable logging.
 */

/* eslint-disable jsdoc/require-param */

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

/**
 * Formats bytes into human-readable size.
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
 * Log when an item is added to the queue.
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
 */
export function logProcessStart( itemId: string, fileName: string ): void {
	log( `Processing started: ${ fileName }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log when an operation starts.
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
 * Log upload start.
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
 * Log upload progress.
 */
export function logUploadProgress(
	itemId: string,
	fileName: string,
	progress: number
): void {
	log( `Upload progress: ${ progress }% - ${ fileName }`, {
		category: 'upload',
		data: { itemId, progress },
	} );
}

/**
 * Log upload completion.
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
 */
export function logQueueRemove( itemId: string, fileName?: string ): void {
	log( `Item removed from queue${ fileName ? `: ${ fileName }` : '' }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log item cancellation.
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
 */
export function logItemPause( itemId: string, reason: string ): void {
	log( `Item paused: ${ reason }`, {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log item resume.
 */
export function logItemResume( itemId: string ): void {
	log( 'Item resumed', {
		category: 'queue',
		data: { itemId },
	} );
}

/**
 * Log concurrency limit hit.
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
 */
export function logBatchComplete( batchId: string ): void {
	log( `Batch completed`, {
		category: 'queue',
		data: { batchId },
	} );
}

/**
 * Log settings update.
 */
export function logSettingsUpdate( settings: Record< string, unknown > ): void {
	log( 'Settings updated', {
		category: 'info',
		data: settings,
	} );
}

/**
 * Log general info message.
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
 * Create a timing helper to measure operation duration.
 */
export function createTimer(): { stop: () => number } {
	const start = performance.now();
	return {
		stop: () => Math.round( performance.now() - start ),
	};
}

/* eslint-enable jsdoc/require-param */
