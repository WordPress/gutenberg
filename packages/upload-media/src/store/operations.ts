import { __ } from '@wordpress/i18n';
import type {
	OperationArgs,
	OperationContext,
	OperationDefinition,
} from './types';
import { OperationType } from './types';
import type { ActionCreators, Selectors } from './private-actions';

/**
 * Concurrency pool for server uploads and sideloads. Its limit is the
 * `maxConcurrentUploads` setting.
 */
export const UPLOAD_POOL = 'upload';

/**
 * Concurrency pool for memory-hungry vips image processing. Its limit is
 * the `maxConcurrentImageProcessing` setting.
 */
export const IMAGE_PROCESSING_POOL = 'image';

/**
 * Concurrency pool for WebCodecs video encoding, limited to one at a time.
 */
export const VIDEO_PROCESSING_POOL = 'video';

/**
 * The context core operations receive on top of the public one.
 *
 * Core steps fan out sideloads with size logic, pick endpoints by
 * `parentId` and so on; that needs the store, which the public context
 * deliberately withholds. Only operations in the `core/` namespace get it.
 */
export interface PrivilegedOperationContext extends OperationContext {
	select: Selectors;
	dispatch: ActionCreators;
}

function privileged( context: OperationContext ): PrivilegedOperationContext {
	if ( ! ( 'dispatch' in context ) || ! ( 'select' in context ) ) {
		throw new Error(
			'Core upload operations need the privileged operation context.'
		);
	}
	return context as PrivilegedOperationContext;
}

/**
 * The operations the package ships with.
 *
 * Each one is a thin adapter onto a private thunk in `private-actions.ts`,
 * registered through the same registry a plugin would use so the dispatch
 * path is identical for core and third-party steps.
 */
export const CORE_OPERATIONS: OperationDefinition[] = [
	{
		name: OperationType.Prepare,
		label: __( 'Preparing' ),
		handler: ( item, _args, context ) =>
			privileged( context ).dispatch.prepareItem( item.id ),
	},
	{
		name: OperationType.DetectUltraHdr,
		label: __( 'Detecting UltraHDR' ),
		handler: ( item, _args, context ) =>
			privileged( context ).dispatch.detectUltraHdr( item.id ),
	},
	{
		name: OperationType.Upload,
		label: __( 'Uploading' ),
		concurrency: {
			pool: UPLOAD_POOL,
			limit: ( settings ) => settings.maxConcurrentUploads,
		},
		handler: ( item, _args, context ) =>
			item.parentId
				? privileged( context ).dispatch.sideloadItem( item.id )
				: privileged( context ).dispatch.uploadItem( item.id ),
	},
	{
		name: OperationType.ResizeCrop,
		label: __( 'Resizing' ),
		concurrency: {
			pool: IMAGE_PROCESSING_POOL,
			limit: ( settings ) => settings.maxConcurrentImageProcessing,
		},
		handler: ( item, args, context ) =>
			privileged( context ).dispatch.resizeCropItem(
				item.id,
				args as OperationArgs[ OperationType.ResizeCrop ]
			),
	},
	{
		name: OperationType.Rotate,
		label: __( 'Rotating' ),
		concurrency: {
			pool: IMAGE_PROCESSING_POOL,
			limit: ( settings ) => settings.maxConcurrentImageProcessing,
		},
		handler: ( item, args, context ) =>
			privileged( context ).dispatch.rotateItem(
				item.id,
				args as OperationArgs[ OperationType.Rotate ]
			),
	},
	{
		name: OperationType.TranscodeImage,
		label: __( 'Converting image' ),
		handler: ( item, args, context ) =>
			privileged( context ).dispatch.transcodeImageItem(
				item.id,
				args as OperationArgs[ OperationType.TranscodeImage ]
			),
	},
	{
		name: OperationType.TranscodeGif,
		label: __( 'Converting GIF to video' ),
		concurrency: { pool: VIDEO_PROCESSING_POOL, limit: 1 },
		handler: ( item, args, context ) =>
			privileged( context ).dispatch.transcodeGifItem(
				item.id,
				args as OperationArgs[ OperationType.TranscodeGif ]
			),
	},
	{
		name: OperationType.ThumbnailGeneration,
		label: __( 'Generating thumbnails' ),
		handler: ( item, _args, context ) =>
			privileged( context ).dispatch.generateThumbnails( item.id ),
	},
	{
		name: OperationType.Finalize,
		label: __( 'Finalizing' ),
		handler: ( item, _args, context ) =>
			privileged( context ).dispatch.finalizeItem( item.id ),
	},
];
