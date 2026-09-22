import { dispatch, select } from '@wordpress/data';
import { store } from './store';
import { unlock } from './lock-unlock';
import type { ActionCreators, Selectors } from './store/private-actions';
import type {
	ConcurrencyPoolDefinition,
	OperationDefinition,
	OperationName,
} from './store/types';
import {
	getRegisterConcurrencyPoolError,
	getRegisterOperationError,
	getUnregisterOperationError,
} from './store/utils/registry';

/**
 * Everything that defines an upload operation except its name, which
 * `registerUploadOperation()` takes separately.
 */
export type UploadOperationSettings< Args = unknown > = Omit<
	OperationDefinition< Args >,
	'name'
>;

/**
 * Everything that defines a concurrency pool except its name, which
 * `registerUploadConcurrencyPool()` takes separately.
 */
export type UploadConcurrencyPoolSettings = Omit<
	ConcurrencyPoolDefinition,
	'name'
>;

function actions(): ActionCreators {
	return unlock< ActionCreators >( dispatch( store ) );
}

function selectors(): Selectors {
	return unlock< Selectors >( select( store ) );
}

/*
 * The store's registration thunks run the same checks, but a dispatched
 * thunk only reports back through a promise. Registration has to answer on
 * the spot, the way registerBlockType() does, so each function below checks
 * first and dispatches only what will go through.
 */

function report( error: string ): undefined {
	// eslint-disable-next-line no-console
	console.error( error );
	return undefined;
}

/**
 * Registers an operation the upload queue can run as a step of an item's
 * pipeline.
 *
 * Names are namespaced like block names. A name that is already registered
 * is rejected, so replacing a step, core's included, is an explicit
 * `unregisterUploadOperation()` followed by a `registerUploadOperation()`
 * under the same name.
 *
 * @example
 * ```js
 * import { registerUploadOperation } from '@wordpress/upload-media';
 *
 * registerUploadOperation( 'my-plugin/generate-subtitles', {
 * 	label: __( 'Generating subtitles', 'my-plugin' ),
 * 	plan( item ) {
 * 		if ( item.file.type.startsWith( 'video/' ) ) {
 * 			return { after: 'core/upload', args: { language: 'en' } };
 * 		}
 * 	},
 * 	async handler( item, args, context ) {
 * 		const vtt = await transcribe( item.file, args.language, {
 * 			signal: context.signal,
 * 		} );
 * 		context.addSideloadItem( {
 * 			file: vtt,
 * 			additionalData: { image_size: 'subtitles' },
 * 		} );
 * 	},
 * } );
 * ```
 *
 * @param name     Namespaced operation name, e.g. `my-plugin/generate-subtitles`.
 * @param settings The operation: its label, handler, and optionally how it
 *                 plans itself into an item's pipeline and which concurrency
 *                 pool it counts against.
 *
 * @return The registered operation, or undefined if it was rejected.
 */
export function registerUploadOperation< Args = unknown >(
	name: OperationName,
	settings: UploadOperationSettings< Args >
): OperationDefinition | undefined {
	const definition: OperationDefinition = {
		...( settings as UploadOperationSettings ),
		name,
	};
	const error = getRegisterOperationError( definition, selectors() );
	if ( error ) {
		return report( error );
	}
	actions().registerOperation( definition );
	return definition;
}

/**
 * Unregisters an upload operation.
 *
 * Refused while any item in the queue still lists the operation in its
 * pipeline, so that no item is left holding a step it cannot finish.
 *
 * @param name Operation name.
 *
 * @return The removed operation, or undefined if it was refused.
 */
export function unregisterUploadOperation(
	name: OperationName
): OperationDefinition | undefined {
	const error = getUnregisterOperationError( name, selectors() );
	if ( error ) {
		return report( error );
	}
	const definition = selectors().getOperation( name );
	actions().unregisterOperation( name );
	return definition;
}

/**
 * Returns a registered upload operation by name.
 *
 * @param name Operation name.
 *
 * @return The operation, or undefined if none is registered under that name.
 */
export function getUploadOperation(
	name: OperationName
): OperationDefinition | undefined {
	return selectors().getOperation( name );
}

/**
 * Returns all registered upload operations, in registration order.
 *
 * @return The operations.
 */
export function getUploadOperations(): OperationDefinition[] {
	return selectors().getOperations();
}

/**
 * Registers a concurrency pool for upload operations to join.
 *
 * A pool is a named limit on how many items may run the operations assigned
 * to it at the same time. It is declared once, here, and operations join it
 * by name through their `concurrency` setting; an operation can only join a
 * pool that is registered. The pools `upload`, `image` and `video` ship
 * with the package.
 *
 * @example
 * ```js
 * import {
 * 	registerUploadConcurrencyPool,
 * 	registerUploadOperation,
 * } from '@wordpress/upload-media';
 *
 * registerUploadConcurrencyPool( 'my-plugin/ocr', { limit: 2 } );
 *
 * registerUploadOperation( 'my-plugin/read-text', {
 * 	label: __( 'Reading text', 'my-plugin' ),
 * 	concurrency: 'my-plugin/ocr',
 * 	// ...
 * } );
 * ```
 *
 * @param name     Pool name.
 * @param settings The pool's limit, either a finite positive number or a
 *                 function of the store settings returning one.
 *
 * @return The registered pool, or undefined if it was rejected.
 */
export function registerUploadConcurrencyPool(
	name: string,
	settings: UploadConcurrencyPoolSettings
): ConcurrencyPoolDefinition | undefined {
	const definition: ConcurrencyPoolDefinition = { ...settings, name };
	const error = getRegisterConcurrencyPoolError( definition, selectors() );
	if ( error ) {
		return report( error );
	}
	actions().registerConcurrencyPool( definition );
	return definition;
}
