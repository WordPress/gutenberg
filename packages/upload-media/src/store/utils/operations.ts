import {
	ITEM_IDENTITY_KEYS,
	PROTECTED_ITEM_KEYS,
	type ConcurrencyPoolDefinition,
	type Operation,
	type OperationDefinition,
	type OperationItem,
	type OperationName,
	type OperationPlacement,
	type OperationPlanContext,
	type QueueItem,
	type Settings,
} from '../types';
import { isValidConcurrencyLimit } from './registry';

/**
 * Default `priority` for an operation's `plan()`.
 */
export const DEFAULT_OPERATION_PRIORITY = 10;

/**
 * Returns the name of an operation, whether or not it carries arguments.
 *
 * @param operation Operation.
 *
 * @return Operation name.
 */
export function getOperationName( operation: Operation ): OperationName {
	return Array.isArray( operation ) ? operation[ 0 ] : operation;
}

/**
 * Returns the arguments of an operation, if any.
 *
 * @param operation Operation.
 *
 * @return Operation arguments.
 */
export function getOperationArgs( operation: Operation ): unknown {
	return Array.isArray( operation ) ? operation[ 1 ] : undefined;
}

/**
 * Takes the snapshot of an item that an operation is handed.
 *
 * The queue's own record of the item holds its callbacks, its abort
 * controller and its pipeline, none of which a step should see or be able
 * to change; what a handler gets is the item's data and its identity. The
 * snapshot is frozen and `additionalData` is copied, so a handler that
 * writes to what it was handed changes nothing in the store — updates go
 * through the handler's result.
 *
 * @param item Queue item.
 *
 * @return What an operation is told about the item.
 */
export function snapshotItem( item: QueueItem ): OperationItem {
	const snapshot: Record< string, unknown > = {};
	for ( const [ key, value ] of Object.entries( item ) ) {
		if (
			( PROTECTED_ITEM_KEYS as readonly string[] ).includes( key ) &&
			! ( ITEM_IDENTITY_KEYS as readonly string[] ).includes( key )
		) {
			continue;
		}
		snapshot[ key ] = value;
	}
	if ( item.additionalData ) {
		snapshot.additionalData = { ...item.additionalData };
	}
	return Object.freeze( snapshot ) as OperationItem;
}

/**
 * Resolves a pool's limit against the current settings.
 *
 * A settings function that returns something unusable — a setting that was
 * never set, or a zero that would stall the pool — is read as 1, so the
 * pool keeps making progress one item at a time instead of deadlocking or
 * running unbounded.
 *
 * @param pool     Pool definition.
 * @param settings Store settings.
 *
 * @return Maximum number of items that may run operations of this pool at once.
 */
export function resolveConcurrencyLimit(
	pool: ConcurrencyPoolDefinition,
	settings: Settings
): number {
	const limit =
		typeof pool.limit === 'function' ? pool.limit( settings ) : pool.limit;
	return isValidConcurrencyLimit( limit ) ? limit : 1;
}

/**
 * Inserts an operation into a pipeline according to a placement.
 *
 * When the placement anchors on a step that is not in the pipeline, the
 * pipeline is returned unchanged. A placement without `before`, `after`
 * or `at` appends the operation.
 *
 * @param operations Pipeline to insert into.
 * @param name       Name of the operation to insert.
 * @param placement  Where to insert it.
 *
 * @return New pipeline.
 */
export function applyOperationPlacement(
	operations: Operation[],
	name: OperationName,
	placement: OperationPlacement
): Operation[] {
	const step: Operation =
		placement.args === undefined ? name : [ name, placement.args ];

	if ( placement.at === 'start' ) {
		return [ step, ...operations ];
	}

	const anchor = placement.before ?? placement.after;
	if ( placement.at === 'end' || anchor === undefined ) {
		return [ ...operations, step ];
	}

	const index = operations.findIndex(
		( operation ) => getOperationName( operation ) === anchor
	);
	if ( index === -1 ) {
		return operations;
	}

	const insertAt = placement.before !== undefined ? index : index + 1;
	return [
		...operations.slice( 0, insertAt ),
		step,
		...operations.slice( insertAt ),
	];
}

/**
 * Runs every registered operation's `plan()` over an item's default
 * pipeline and returns the resulting pipeline.
 *
 * Plans run in ascending `priority`, ties in registration order. Each plan
 * sees the pipeline as left by the plans before it.
 *
 * @param item        Queue item being planned.
 * @param operations  Pipeline as decided by core.
 * @param definitions Registered operations, in registration order.
 * @param settings    Store settings.
 *
 * @return Planned pipeline.
 */
export async function planOperations(
	item: QueueItem,
	operations: Operation[],
	definitions: OperationDefinition[],
	settings: Settings
): Promise< Operation[] > {
	let planned = [ ...operations ];
	const snapshot = snapshotItem( item );

	// Array.prototype.sort is stable, so equal priorities keep registration order.
	const sorted = [ ...definitions ].sort(
		( a, b ) =>
			( a.priority ?? DEFAULT_OPERATION_PRIORITY ) -
			( b.priority ?? DEFAULT_OPERATION_PRIORITY )
	);

	for ( const definition of sorted ) {
		if ( ! definition.plan ) {
			continue;
		}

		const context: OperationPlanContext = {
			operations: [ ...planned ],
			settings,
		};
		const result = await definition.plan( snapshot, context );

		if ( ! result ) {
			continue;
		}

		if ( Array.isArray( result ) ) {
			planned = [ ...result ];
			continue;
		}

		planned = applyOperationPlacement( planned, definition.name, result );
	}

	return planned;
}
