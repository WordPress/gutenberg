/**
 * Client-side media processing filters.
 *
 * Async filters let plugins intervene in sub-size generation and finalize:
 *
 * 1. `uploadMedia.planImageSize` — runs while thumbnails are being queued.
 *    Use size name / MIME metadata to set a provisional quality (keep this
 *    path fast so child items enter the parallel encode queue promptly).
 *    Return one plan, an array of plans (to split a dimension group into
 *    separate encodes), or `null` to skip.
 * 2. `uploadMedia.encodeImage` — runs immediately before a vips resize or
 *    format conversion. Use this for detailed analysis or trial encodes;
 *    helpers are provided on the context object.
 * 3. `uploadMedia.finalizeData` — runs just before the finalize request.
 *    Accumulated `finalizeData` (via `mergeFinalizeData` / encode context
 *    helper) is filtered and sent as `client_extended_data`.
 *
 * Plan/encode filters fall back to the provisional values when a callback
 * throws or returns an invalid shape, so a faulty plugin cannot block uploads.
 */

import { applyFiltersAsync } from '@wordpress/hooks';
import type { ImageSizeCrop, QueueItemId } from './store/types';

type VipsResizeImage = typeof import('./store/utils').vipsResizeImage;
type VipsConvertImageFormat =
	typeof import('./store/utils').vipsConvertImageFormat;

/**
 * Filter name for planning a sub-size before it is enqueued.
 */
export const PLAN_IMAGE_SIZE_HOOK = 'uploadMedia.planImageSize';

/**
 * Filter name for refining encode parameters immediately before vips runs.
 */
export const ENCODE_IMAGE_HOOK = 'uploadMedia.encodeImage';

/**
 * Filter name for refining client data sent with the finalize request.
 */
export const FINALIZE_DATA_HOOK = 'uploadMedia.finalizeData';

/**
 * Arguments passed through `uploadMedia.planImageSize`.
 *
 * Return the (possibly modified) plan to enqueue the size, an array of plans
 * to enqueue separate encodes for the same dimension group (for example
 * different quality per size name), or `null` to skip generating that size
 * entirely.
 */
export interface PlanImageSizeArgs {
	/** Registered size name(s) sharing these dimensions. */
	sizeNames: string[];
	/** Target dimensions and crop. */
	resize: ImageSizeCrop;
	/**
	 * Provisional encode quality on the 0–1 scale (from `image_quality` /
	 * `wp_editor_set_quality`, possibly already adjusted by earlier filters).
	 */
	quality: number;
	/** MIME type of the source file used for this sub-size. */
	sourceMimeType: string;
	/**
	 * Target MIME type when a subsequent TranscodeImage step will run.
	 * Undefined when the resized file is uploaded as-is.
	 */
	outputMimeType?: string;
	/** Whether this plan is for the big-image `-scaled` copy. */
	isThresholdResize?: boolean;
	/** Source file that will be resized. */
	file: File;
}

/**
 * Which encode step is about to run.
 */
export type EncodeImageOperation = 'resize' | 'transcode';

/**
 * Arguments passed through `uploadMedia.encodeImage`.
 *
 * Return a (possibly modified) object. `quality` and `file` are the fields
 * typically adjusted; other fields are informational for analysis.
 */
export interface EncodeImageArgs {
	/** File about to be encoded. */
	file: File;
	/** Current quality on the 0–1 scale. */
	quality: number;
	/** Whether this is a resize/crop or a format conversion. */
	operation: EncodeImageOperation;
	/** Resize target when `operation` is `'resize'`. */
	resize?: ImageSizeCrop;
	/** Output MIME type when `operation` is `'transcode'`. */
	outputMimeType?: string;
	/** Progressive/interlaced flag for transcode. */
	interlaced?: boolean;
	/** Size name(s) this encode belongs to, when known. */
	sizeNames?: string[];
	/** Whether this encode is the big-image `-scaled` copy. */
	isThresholdResize?: boolean;
}

/**
 * Helpers and metadata supplied alongside `uploadMedia.encodeImage`.
 *
 * Trial encodes should reuse these wrappers so crop, UltraHDR, bit-depth,
 * and strip-meta behavior match the production path. Work runs inside the
 * image-processing concurrency slot (default 2).
 */
export interface EncodeImageContext {
	itemId: QueueItemId;
	signal?: AbortSignal;
	stripMeta?: boolean;
	maxBitdepth?: number;
	/**
	 * Quality stamped onto the queue item at plan/enqueue time (after
	 * `uploadMedia.planImageSize`). Immutable for this encode — compare
	 * against `encode.quality` when refining.
	 */
	provisionalQuality: number;
	/**
	 * Merges data into the parent item's finalize payload (`client_extended_data`).
	 * Prefer this over calling the store action with a child item ID.
	 */
	mergeFinalizeData: ( data: Record< string, unknown > ) => void;
	resizeImage: VipsResizeImage;
	convertImageFormat: VipsConvertImageFormat;
}

/**
 * Context for `uploadMedia.finalizeData`.
 */
export interface FinalizeDataContext {
	itemId: QueueItemId;
	attachmentId: number;
	subSizes: import('./store/types').SubSizeData[];
}

/**
 * Clamps a quality value to the 0–1 range, falling back when invalid.
 *
 * @param quality  Candidate quality.
 * @param fallback Value to use when `quality` is not a finite number.
 */
export function normalizeQuality( quality: unknown, fallback: number ): number {
	if ( typeof quality !== 'number' || ! Number.isFinite( quality ) ) {
		return fallback;
	}
	return Math.min( 1, Math.max( 0, quality ) );
}

/**
 * Applies `uploadMedia.planImageSize`, validating the result.
 *
 * Filters may return:
 * - one plan object (possibly modified),
 * - an array of plans to enqueue separate encodes (e.g. same dimensions,
 *   different quality per size name),
 * - `null` (or an empty array) to skip the whole group.
 *
 * @param args Provisional plan for one dimension group / scaled copy.
 * @return Filtered plan(s), or `null` when the size(s) should be skipped.
 */
export async function applyPlanImageSizeFilter(
	args: PlanImageSizeArgs
): Promise< PlanImageSizeArgs | PlanImageSizeArgs[] | null > {
	let result: PlanImageSizeArgs | PlanImageSizeArgs[] | null;
	try {
		result = ( await applyFiltersAsync(
			PLAN_IMAGE_SIZE_HOOK,
			args
		) ) as PlanImageSizeArgs | PlanImageSizeArgs[] | null;
	} catch {
		// A throwing filter must not block thumbnail generation.
		return args;
	}

	if ( result === null ) {
		return null;
	}

	if ( Array.isArray( result ) ) {
		const plans = result
			.map( ( plan ) => normalizePlanImageSizeResult( plan, args ) )
			.filter(
				( plan ): plan is PlanImageSizeArgs =>
					plan !== null && plan.sizeNames.length > 0
			);
		return plans.length > 0 ? plans : null;
	}

	// Invalid non-array results fall back to the provisional plan so a buggy
	// filter cannot skip sizes by accident (use `null` to skip intentionally).
	return normalizePlanImageSizeResult( result, args ) ?? args;
}

/**
 * Normalizes one plan returned from `uploadMedia.planImageSize`.
 *
 * @param result Candidate plan from a filter.
 * @param args   Provisional plan used as fallback.
 * @return Normalized plan, or `null` when the candidate is invalid.
 */
function normalizePlanImageSizeResult(
	result: unknown,
	args: PlanImageSizeArgs
): PlanImageSizeArgs | null {
	if ( ! result || typeof result !== 'object' || Array.isArray( result ) ) {
		return null;
	}

	const plan = result as Partial< PlanImageSizeArgs >;
	const resize =
		plan.resize && typeof plan.resize === 'object'
			? plan.resize
			: args.resize;

	return {
		...args,
		...plan,
		resize,
		quality: normalizeQuality( plan.quality, args.quality ),
		file: plan.file instanceof File ? plan.file : args.file,
		sizeNames: Array.isArray( plan.sizeNames )
			? plan.sizeNames
			: args.sizeNames,
	};
}

/**
 * Applies `uploadMedia.encodeImage`, validating the result.
 *
 * @param args    Provisional encode arguments.
 * @param context Vips helpers and item metadata.
 * @return Filtered encode arguments.
 */
export async function applyEncodeImageFilter(
	args: EncodeImageArgs,
	context: EncodeImageContext
): Promise< EncodeImageArgs > {
	let result: EncodeImageArgs;
	try {
		result = ( await applyFiltersAsync(
			ENCODE_IMAGE_HOOK,
			args,
			context
		) ) as EncodeImageArgs;
	} catch {
		// A throwing filter must not block the encode; keep provisional values.
		return args;
	}

	if ( ! result || typeof result !== 'object' ) {
		return args;
	}

	return {
		...args,
		...result,
		quality: normalizeQuality( result.quality, args.quality ),
		file: result.file instanceof File ? result.file : args.file,
		operation: args.operation,
		resize: result.resize ?? args.resize,
		outputMimeType: result.outputMimeType ?? args.outputMimeType,
		interlaced: result.interlaced ?? args.interlaced,
		sizeNames: result.sizeNames ?? args.sizeNames,
		isThresholdResize: result.isThresholdResize ?? args.isThresholdResize,
	};
}

/**
 * Applies `uploadMedia.finalizeData`, validating the result.
 *
 * @param data    Accumulated finalize payload.
 * @param context Attachment and sub-size context.
 * @return Filtered client data object.
 */
export async function applyFinalizeDataFilter(
	data: Record< string, unknown >,
	context: FinalizeDataContext
): Promise< Record< string, unknown > > {
	let result: Record< string, unknown >;
	try {
		result = ( await applyFiltersAsync(
			FINALIZE_DATA_HOOK,
			data,
			context
		) ) as Record< string, unknown >;
	} catch {
		return data;
	}

	if ( ! result || typeof result !== 'object' || Array.isArray( result ) ) {
		return data;
	}

	return result;
}

/**
 * Normalizes `additionalData.image_size` into a size-name array.
 *
 * @param imageSize Size name or names from the sideload item.
 */
export function sizeNamesFromImageSize(
	imageSize: string | string[] | undefined
): string[] | undefined {
	if ( ! imageSize ) {
		return undefined;
	}
	return Array.isArray( imageSize ) ? imageSize : [ imageSize ];
}
