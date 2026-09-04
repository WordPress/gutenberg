import { __ } from '@wordpress/i18n';
import { dispatch, select, subscribe } from '@wordpress/data';
import {
	detectClientSideMediaSupport,
	isHeicCanvasSupported,
} from '@wordpress/upload-media';

/**
 * Routes uploads started from the editor's media modal through the client-side
 * media pipeline.
 *
 * Uploads the editor itself starts - dropping a file on a block, the inserter,
 * the Upload button - go through the block editor's `mediaUpload` setting,
 * which the block editor provider swaps for the `@wordpress/upload-media`
 * pipeline wherever client-side processing is available. The media modal is
 * Backbone `wp.media`, and its uploader is core's `wp.Uploader`/plupload,
 * which nothing intercepts: it posts the original bytes to `async-upload.php`.
 * A HEIC file that converts and uploads when dropped on an Image block
 * therefore fails when dropped on the modal, and files uploaded there skip
 * browser-generated sub-sizes, the big-image threshold, and animated GIF
 * handling too.
 *
 * Binding a higher-priority `FilesAdded` handler on every `wp.Uploader`
 * instance hands those files to the same pipeline instead. plupload's own
 * placeholder attachments, progress, and `wp.Uploader.errors` are mirrored, so
 * the modal's UI works unchanged.
 *
 * @see https://github.com/WordPress/gutenberg/issues/82409
 */

declare global {
	interface Window {
		__clientSideMediaProcessing?: boolean;
		plupload?: { FAILED: number };
	}
}

/**
 * Name of the upload-media store.
 *
 * The store is addressed by name rather than through the `store` descriptor
 * `@wordpress/upload-media` exports: importing that descriptor would pull the
 * store - and with it `@wordpress/private-apis` - into the module graph of
 * every bundled package that imports `@wordpress/media-utils`.
 */
const UPLOAD_STORE = 'core/upload-media';

/**
 * HEIC MIME types, the only ones routed through the pipeline when the browser
 * supports canvas conversion but not full client-side processing.
 */
const HEIC_MIME_TYPES = [ 'image/heic', 'image/heif' ];

/**
 * File names whose extension the modal can type before the upload finishes.
 */
const IMAGE_EXTENSION = /(?:jpe?g|png|gif|webp|avif|heic|heif)$/i;

/**
 * The parts of a plupload file this module relies on.
 */
type PluploadFile = {
	status: number;
	name: string;
	size: number;
	loaded: number;
	percent: number;
	type?: string;
	getNative?: () => File | null;
};

/**
 * The bookkeeping kept for one queued upload.
 */
type UploadEntry = {
	/** Identity key of the file being uploaded. */
	key: string;
	/** ID of the queue item it matched, once one is known. */
	itemId: string | null;
	/** Called with an integer percentage whenever it changes. */
	onProgress: ( percent: number ) => void;
	/** Last percentage reported. */
	lastPercent: number;
	/** Operation counts the progress estimate is derived from. */
	totals: { total: number; remaining: number } | null;
	/** Whether the upload has finished. */
	released: boolean;
};

// Uploads waiting to be matched to a queue item, keyed by file identity
// (concurrent uploads of an identical file share a key and are matched in
// order), and uploads already matched, keyed by queue item id. Items are
// matched by id from then on because the store swaps `sourceFile` for HEIC
// files once they are converted.
const pending = new Map< string, UploadEntry[] >();
const active = new Map< string, UploadEntry >();

// Number of queued files that have not succeeded or failed yet.
let inFlight = 0;

let isInstalled = false;
let unsubscribe: ( () => void ) | undefined;

/**
 * Builds a stable identity key for a file.
 *
 * The queue item's `sourceFile` is a clone of the original file, so it cannot
 * be matched by reference. The clone preserves name, size, and last-modified
 * time, which together identify a file within one session.
 *
 * @param file The file to key.
 * @return Identity key.
 */
function fileKey( file: File ): string {
	return `${ file.name }::${ file.size }::${ file.lastModified }`;
}

/**
 * Whether the browser runs the full client-side pipeline on this page.
 *
 * @return True when every upload can be processed in the browser.
 */
function isFullPipelineActive(): boolean {
	return Boolean(
		window.__clientSideMediaProcessing &&
			detectClientSideMediaSupport?.()?.supported
	);
}

/**
 * Whether the browser converts HEIC files on a canvas but cannot run the full
 * pipeline - Safari, notably.
 *
 * @return True when only HEIC files can be processed in the browser.
 */
function isHeicOnlyPipelineActive(): boolean {
	return Boolean(
		window.__clientSideMediaProcessing &&
			! isFullPipelineActive() &&
			isHeicCanvasSupported?.()
	);
}

/**
 * Whether the pipeline has the settings it needs to accept files.
 *
 * The block editor provider writes them into the store as it mounts, so a file
 * added before that - or on a screen where `@wordpress/upload-media` never
 * registered its store - has to stay on the classic path: a degradation, never
 * data loss.
 *
 * @return True when the store is ready to accept files.
 */
function isPipelineReady(): boolean {
	return Boolean( select( UPLOAD_STORE )?.getSettings()?.mediaUpload );
}

/**
 * Whether a batch of files added to plupload can go through the pipeline.
 *
 * Suppressing plupload's built-in handler is all-or-nothing, so the whole batch
 * stays on the classic path when any file cannot be handled: plupload exposes
 * no native `File` for sources it cannot represent as one, and in HEIC-only
 * mode everything but a HEIC file is still processed server-side.
 *
 * @param files Files added to the plupload queue.
 * @return True when every file can go through the pipeline.
 */
function canHandleBatch( files: PluploadFile[] ): boolean {
	const heicOnly = isHeicOnlyPipelineActive();

	return files.every( ( file ) => {
		if ( window.plupload?.FAILED === file.status ) {
			return true;
		}
		if ( ! file.getNative?.() ) {
			return false;
		}
		return ! heicOnly || HEIC_MIME_TYPES.includes( file.type || '' );
	} );
}

/**
 * Builds the extra fields to send with an upload from plupload's multipart
 * parameters.
 *
 * Anything a plugin added through the `plupload_default_params` filter or
 * `wp.Uploader.param()` reached the classic upload as a `$_POST` field, so it
 * is forwarded to the REST request the same way. The classic transport's own
 * fields are dropped: `action` and `_wpnonce` belong to `async-upload.php`, and
 * `post_id` is spelled `post` by the REST API.
 *
 * @param params Plupload's multipart parameters.
 * @return Additional data for the upload.
 */
function additionalDataFromParams(
	params: Record< string, string >
): Record< string, unknown > {
	const additionalData: Record< string, unknown > = {};

	Object.keys( params || {} ).forEach( ( key ) => {
		if ( 'action' === key || '_wpnonce' === key || 'post_id' === key ) {
			return;
		}
		additionalData[ key ] = params[ key ];
	} );

	const postId = parseInt( params?.post_id, 10 );
	if ( postId ) {
		additionalData.post = postId;
	}

	return additionalData;
}

/**
 * Estimates the progress (0-100) of a queue item.
 *
 * The pipeline never reports a numeric `progress` on its queue items, so
 * estimate one from the item's operation queue instead: each finished
 * operation (prepare, transcode, upload, thumbnails, finalize) advances the
 * bar, and the sub-sizes sideloaded so far advance it within thumbnail
 * generation. A real `progress` is preferred whenever one shows up.
 *
 * @param item  The upload-media queue item.
 * @param entry The bookkeeping for the upload.
 * @return Estimated progress.
 */
function estimateProgress( item: any, entry: UploadEntry ): number {
	if ( typeof item.progress === 'number' ) {
		return item.progress;
	}

	const remaining = item.operations?.length ?? 0;
	let totals = entry.totals;
	if ( ! totals ) {
		totals = { total: remaining, remaining };
		entry.totals = totals;
	}
	// Operations are appended after preparation, so grow the total.
	if ( remaining > totals.remaining ) {
		totals.total += remaining - totals.remaining;
	}
	totals.remaining = remaining;

	if ( totals.total === 0 ) {
		return 0;
	}

	const imageSizeCount = Object.keys(
		select( UPLOAD_STORE ).getSettings()?.allImageSizes || {}
	).length;
	const completed = totals.total - remaining;
	let fraction = 0;
	if ( 'THUMBNAIL_GENERATION' === item.currentOperation && imageSizeCount ) {
		fraction = Math.min(
			1,
			( item.subSizes?.length ?? 0 ) / imageSizeCount
		);
	}

	return ( ( completed + fraction ) / totals.total ) * 100;
}

/**
 * Matches queue items to queued uploads and reports their progress.
 *
 * Runs on every change to the upload-media store. Sub-size children carry the
 * parent's file and are skipped; only top-level items drive the modal's
 * progress bars. Progress holds at 99 until the upload's success callback has
 * run, so no tile looks finished before the modal has synced the result.
 */
function onStoreChange(): void {
	if ( inFlight === 0 ) {
		return;
	}

	select( UPLOAD_STORE )
		.getItems()
		.forEach( ( item: any ) => {
			if ( item.parentId || ! item.sourceFile ) {
				return;
			}

			let entry = active.get( item.id );
			if ( ! entry ) {
				const key = fileKey( item.sourceFile );
				const list = pending.get( key );
				if ( ! list?.length ) {
					return;
				}
				entry = list.shift() as UploadEntry;
				if ( ! list.length ) {
					pending.delete( key );
				}
				entry.itemId = item.id;
				active.set( item.id, entry );
			}

			const percent = Math.min(
				99,
				Math.round( estimateProgress( item, entry ) )
			);
			if ( percent !== entry.lastPercent ) {
				entry.lastPercent = percent;
				entry.onProgress( percent );
			}
		} );
}

/**
 * Stops tracking an upload once it has succeeded or failed.
 *
 * @param entry The bookkeeping for the upload.
 */
function release( entry: UploadEntry ): void {
	if ( entry.released ) {
		return;
	}
	entry.released = true;
	inFlight--;

	const list = pending.get( entry.key );
	if ( list ) {
		const index = list.indexOf( entry );
		if ( index !== -1 ) {
			list.splice( index, 1 );
		}
		if ( ! list.length ) {
			pending.delete( entry.key );
		}
	}

	if ( entry.itemId ) {
		active.delete( entry.itemId );
	}
}

/**
 * Queues a file for client-side processing and upload.
 *
 * @param file                 The file to upload.
 * @param additionalData       Extra fields to send with the attachment.
 * @param callbacks            Lifecycle callbacks.
 * @param callbacks.onSuccess  Called with the finalized attachment.
 * @param callbacks.onError    Called with the reason the upload failed.
 * @param callbacks.onProgress Called with an integer percentage whenever it changes.
 */
function queueFile(
	file: File,
	additionalData: Record< string, unknown >,
	callbacks: {
		onSuccess: ( attachment: any ) => void;
		onError: ( error: unknown ) => void;
		onProgress: ( percent: number ) => void;
	}
): void {
	const entry: UploadEntry = {
		key: fileKey( file ),
		itemId: null,
		onProgress: callbacks.onProgress,
		lastPercent: -1,
		totals: null,
		released: false,
	};

	const list = pending.get( entry.key );
	if ( list ) {
		list.push( entry );
	} else {
		pending.set( entry.key, [ entry ] );
	}
	inFlight++;

	unsubscribe = unsubscribe ?? subscribe( onStoreChange, UPLOAD_STORE );

	void dispatch( UPLOAD_STORE ).addItems( {
		files: [ file ],
		additionalData,
		onSuccess: ( attachments: any[] ) => {
			release( entry );
			callbacks.onSuccess( attachments[ 0 ] );
		},
		onError: ( error: unknown ) => {
			release( entry );
			callbacks.onError( error );
		},
	} );
}

/**
 * Builds the text shown for a failed upload.
 *
 * A pipeline error is not always an `Error`: the store reports a string for
 * some failures and a REST rejection is a plain object.
 *
 * @param error The upload error.
 * @return A human-readable message.
 */
function getErrorText( error: unknown ): string {
	if ( typeof error === 'string' && error ) {
		return error;
	}

	const message = ( error as { message?: string } )?.message;

	return message || __( 'An error occurred while uploading the file.' );
}

/**
 * Handles a finished upload by syncing the modal's tile with the server data.
 *
 * The pipeline returns a REST attachment, while the modal's tile is a
 * `wp.media` attachment, so the model is refetched by ID rather than filled in
 * from the response.
 *
 * @param wpUploader    The `wp.Uploader` instance that queued the file.
 * @param model         The placeholder attachment model.
 * @param attachment    The finalized attachment.
 * @param attachment.id ID of the finalized attachment.
 */
function handleSuccess(
	wpUploader: any,
	model: any,
	attachment: { id: number }
): void {
	const { wp } = window as any;

	model.set( { id: attachment.id }, { silent: true } );

	// Register the model in Attachments.all (parity with wp-plupload.js).
	wp.media.model.Attachment.get( attachment.id, model );

	const clearUploadingState = () => {
		[ 'file', 'loaded', 'size', 'percent' ].forEach( ( key ) =>
			model.unset( key, { silent: true } )
		);
		model.set( { uploading: false } );
	};

	model
		.fetch()
		.done( clearUploadingState )
		.fail( () => {
			// The fetch failed but the upload did not: clear the uploading
			// state with what the pipeline returned so no tile is stuck.
			model.set( attachment, { silent: true } );
			clearUploadingState();
		} )
		.always( () => {
			maybeResetQueue();
			wpUploader.success( model );
		} );
}

/**
 * Handles a failed upload by removing the tile and surfacing the message.
 *
 * The error goes into `wp.Uploader.errors` exactly like a classic upload
 * error, so the modal's own error list renders and announces it.
 *
 * @param wpUploader The `wp.Uploader` instance that queued the file.
 * @param model      The placeholder attachment model.
 * @param error      The upload error.
 * @param file       The plupload file that failed.
 */
function handleError(
	wpUploader: any,
	model: any,
	error: unknown,
	file: PluploadFile
): void {
	const { wp } = window as any;
	const message = getErrorText( error );

	model.destroy();

	wp.Uploader.errors.unshift( { message, data: {}, file } );

	maybeResetQueue();

	wpUploader.error( message, {}, file );
}

/**
 * Resets the upload queue once every attachment has finished uploading.
 *
 * Parity with wp-plupload.js, which flips the modal back to browse mode.
 */
function maybeResetQueue(): void {
	const { wp } = window as any;

	const complete = wp.Uploader.queue.all(
		( attachment: any ) => ! attachment.get( 'uploading' )
	);

	if ( complete ) {
		wp.Uploader.queue.reset();
	}
}

/**
 * Intercepts files added to a plupload uploader.
 *
 * Returns `undefined` (not `false`) when the pipeline cannot take the batch so
 * that the built-in handler runs and uploads server-side. Otherwise builds the
 * same placeholder tiles as wp-plupload, routes each file through the
 * pipeline, and returns `false` to suppress the built-in handler.
 *
 * @param wpUploader The `wp.Uploader` instance.
 * @param up         The plupload uploader instance.
 * @param files      Files added to the queue.
 * @return False to suppress the built-in handler.
 */
function handleFilesAdded(
	wpUploader: any,
	up: any,
	files: PluploadFile[]
): boolean | undefined {
	if (
		! ( isFullPipelineActive() || isHeicOnlyPipelineActive() ) ||
		! isPipelineReady() ||
		! canHandleBatch( files )
	) {
		return undefined;
	}

	const { wp, plupload } = window as any;
	const additionalData = additionalDataFromParams(
		up.settings?.multipart_params
	);

	files.forEach( ( file ) => {
		// Ignore failed uploads.
		if ( plupload.FAILED === file.status ) {
			return;
		}

		// The same placeholder attributes wp-plupload.js builds, so the
		// modal's uploading tiles and progress bars work unchanged.
		const attributes: Record< string, unknown > = {
			file,
			uploading: true,
			date: new Date(),
			filename: file.name,
			menuOrder: 0,
			uploadedTo: wp.media.model.settings.post.id,
			loaded: file.loaded,
			size: file.size,
			percent: file.percent,
		};

		// Early mime type scanning for images, as wp-plupload.js does,
		// extended with the formats the pipeline accepts.
		const image = IMAGE_EXTENSION.exec( file.name );
		if ( image ) {
			const extension = image[ 0 ].toLowerCase();
			attributes.type = 'image';
			// `jpg` is not a valid subtype, so map it to `jpeg`.
			attributes.subtype = 'jpg' === extension ? 'jpeg' : extension;
		}

		const model = wp.media.model.Attachment.create( attributes );
		wp.Uploader.queue.add( model );
		wpUploader.added( model );

		// canHandleBatch() established that every file has one.
		const nativeFile = file.getNative?.() as File;

		// Remove the file from plupload so it is not uploaded twice.
		up.removeFile( file );

		queueFile( nativeFile, additionalData, {
			onSuccess: ( attachment ) =>
				handleSuccess( wpUploader, model, attachment ),
			onError: ( error ) => handleError( wpUploader, model, error, file ),
			onProgress: ( percent ) => model.set( { percent } ),
		} );
	} );

	up.refresh();

	return false;
}

/**
 * Binds the pipeline to every `wp.Uploader` instance created from now on.
 *
 * Safe to call repeatedly: the patch is applied once, and it decides per batch
 * of files whether the pipeline can take them, so an uploader created before
 * the block editor configured the pipeline still works.
 */
export function installClientSideModalUploads(): void {
	const { wp, plupload } = window as any;

	if ( isInstalled || ! wp?.Uploader || ! wp?.media || ! plupload ) {
		return;
	}

	isInstalled = true;

	// wp.Uploader.prototype.init is an empty stub core calls once per
	// instance, after plupload has been initialized.
	const originalInit = wp.Uploader.prototype.init;
	wp.Uploader.prototype.init = function ( this: any, ...args: unknown[] ) {
		originalInit.apply( this, args );

		const up = this.uploader;
		if ( ! up || up.__clientSideUploadsBound ) {
			return;
		}
		up.__clientSideUploadsBound = true;

		// plupload sorts handlers by priority (descending) and a `false`
		// return breaks the chain, so priority 100 runs before and suppresses
		// the built-in FilesAdded handler.
		up.bind(
			'FilesAdded',
			( uploader: any, files: PluploadFile[] ) =>
				handleFilesAdded( this, uploader, files ),
			this,
			100
		);
	};
}
