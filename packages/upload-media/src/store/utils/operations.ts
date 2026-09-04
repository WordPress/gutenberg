import type {
	Operation,
	OperationConcurrency,
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
 * Returns the name of the concurrency pool an operation counts against.
 *
 * @param definition Operation definition.
 *
 * @return Pool name, or undefined for unthrottled operations.
 */
export function getConcurrencyPool(
	definition: OperationDefinition | undefined
): string | undefined {
	const concurrency: OperationConcurrency | undefined =
		definition?.concurrency;
	if ( ! concurrency ) {
		return undefined;
	}
	return typeof concurrency === 'string' ? concurrency : concurrency.pool;
}

/**
 * Returns the limit an operation declares for its pool, if it declares one.
 *
 * @param definition Operation definition.
 * @param settings   Store settings, for limits derived from settings.
 *
 * @return Declared limit, or undefined when the operation only joins a pool.
 */
export function getDeclaredConcurrencyLimit(
	definition: OperationDefinition,
	settings: Settings
): number | undefined {
	const { concurrency } = definition;
	if ( ! concurrency || typeof concurrency === 'string' ) {
		return undefined;
	}
	return typeof concurrency.limit === 'function'
		? concurrency.limit( settings )
		: concurrency.limit;
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

/**
 * Returns the names in a pipeline that have no registered operation.
 *
 * @param operations Pipeline to check.
 * @param registry   Registered operations keyed by name.
 *
 * @return Unregistered operation names, without duplicates.
 */
export function getUnregisteredOperations(
	operations: Operation[],
	registry: Record< OperationName, OperationDefinition >
): OperationName[] {
	const missing = new Set< OperationName >();
	for ( const operation of operations ) {
		const name = getOperationName( operation );
		if ( ! registry[ name ] ) {
			missing.add( name );
		}
	}
	return Array.from( missing );
}
