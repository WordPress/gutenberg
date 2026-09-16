import type {
	ConcurrencyPoolDefinition,
	Operation,
	OperationDefinition,
	OperationName,
	OperationPlacement,
	OperationPlanContext,
	QueueItem,
	Settings,
} from '../types';

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
 * Whether a value can serve as a concurrency pool's limit.
 *
 * A pool exists to throttle, so its limit has to be a finite positive
 * number: zero would stall the pool for good and `NaN` would compare
 * false against every count, letting the pool run unbounded.
 *
 * @param limit Value to check.
 *
 * @return True when the value is a usable limit.
 */
export function isValidConcurrencyLimit( limit: unknown ): limit is number {
	return typeof limit === 'number' && Number.isFinite( limit ) && limit > 0;
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
		const result = await definition.plan( item, context );

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
