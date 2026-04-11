/**
 * Internal dependencies
 */
import { ItemStatus, OperationType } from './types';
import type { QueueItem, Settings, State } from './types';

/**
 * Summary of the current upload queue, suitable for rendering a single
 * high-level progress indicator (count, overall percentage, current filename).
 */
export interface UploadProgressSummary {
	/** Total number of items currently in the queue. */
	total: number;
	/** Number of items that have finished uploading. */
	completed: number;
	/** Approximate overall progress across the batch, 0–100. */
	progress: number;
	/** File name of the item currently being processed, if any. */
	currentFilename?: string;
}

/**
 * Returns all items currently being uploaded.
 *
 * @param state Upload state.
 *
 * @return Queue items.
 */
export function getItems( state: State ): QueueItem[] {
	return state.queue;
}

/**
 * Determines whether any upload is currently in progress.
 *
 * @param state Upload state.
 *
 * @return Whether any upload is currently in progress.
 */
export function isUploading( state: State ): boolean {
	return state.queue.length >= 1;
}

/**
 * Determines whether an upload is currently in progress given an attachment URL.
 *
 * @param state Upload state.
 * @param url   Attachment URL.
 *
 * @return Whether upload is currently in progress for the given attachment.
 */
export function isUploadingByUrl( state: State, url: string ): boolean {
	return state.queue.some(
		( item ) => item.attachment?.url === url || item.sourceUrl === url
	);
}

/**
 * Determines whether an upload is currently in progress given an attachment ID.
 *
 * @param state        Upload state.
 * @param attachmentId Attachment ID.
 *
 * @return Whether upload is currently in progress for the given attachment.
 */
export function isUploadingById( state: State, attachmentId: number ): boolean {
	return state.queue.some(
		( item ) =>
			item.attachment?.id === attachmentId ||
			item.sourceAttachmentId === attachmentId
	);
}

/**
 * Returns the media upload settings.
 *
 * @param state Upload state.
 *
 * @return Settings
 */
export function getSettings( state: State ): Settings {
	return state.settings;
}

/**
 * Returns a summary of the current upload queue, or `null` when the queue is
 * empty. Intended for a single high-level progress indicator rather than a
 * per-item list.
 *
 * The overall `progress` prefers the average of per-item `progress` values
 * when every item has one; otherwise it falls back to `completed / total`
 * so the bar still advances meaningfully before per-item progress is wired
 * through the upload pipeline.
 *
 * @param state Upload state.
 *
 * @return Summary of the current upload queue, or null when idle.
 */
export function getUploadProgressSummary(
	state: State
): UploadProgressSummary | null {
	const items = state.queue;
	if ( items.length === 0 ) {
		return null;
	}

	const total = items.length;
	const completed = items.filter(
		( item ) => item.status === ItemStatus.Uploaded
	).length;

	// Prefer the item currently in the UPLOAD operation; fall back to the
	// first non-uploaded, non-errored item so there is still something to
	// label while preparatory operations (resize, transcode) run.
	const current =
		items.find(
			( item ) =>
				item.currentOperation === OperationType.Upload &&
				item.status !== ItemStatus.Uploaded
		) ??
		items.find(
			( item ) =>
				item.status !== ItemStatus.Uploaded &&
				item.status !== ItemStatus.Error
		);

	const progressValues = items
		.map( ( item ) => item.progress )
		.filter( ( value ): value is number => typeof value === 'number' );

	const progress =
		progressValues.length === items.length
			? Math.round(
					progressValues.reduce( ( sum, value ) => sum + value, 0 ) /
						items.length
			  )
			: Math.round( ( completed / total ) * 100 );

	return {
		total,
		completed,
		progress,
		currentFilename: current?.file.name,
	};
}
