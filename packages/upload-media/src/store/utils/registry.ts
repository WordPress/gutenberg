import type {
	ConcurrencyPoolDefinition,
	OperationDefinition,
	OperationName,
	QueueItem,
} from '../types';
import { getOperationName } from './operations';

/**
 * What the registry checks need to know about the store.
 *
 * Both the store's own registration thunks and the public registration
 * functions run these checks: a thunk's result only arrives through a
 * promise, so a function that has to say synchronously whether it
 * registered anything, the way `registerBlockType()` does, checks first
 * and dispatches only what will go through.
 */
export interface RegistrySelect {
	getOperation: ( name: OperationName ) => OperationDefinition | undefined;
	getConcurrencyPool: (
		name: string
	) => ConcurrencyPoolDefinition | undefined;
	getAllItems: () => QueueItem[];
}

const OPERATION_NAME_PATTERN = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

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
 * Says why an operation cannot be registered, if it cannot.
 *
 * @param definition Operation definition.
 * @param select     Store selectors.
 *
 * @return The reason, or undefined when the registration can go ahead.
 */
export function getRegisterOperationError(
	definition: OperationDefinition,
	select: Pick< RegistrySelect, 'getOperation' | 'getConcurrencyPool' >
): string | undefined {
	if (
		typeof definition?.name !== 'string' ||
		! OPERATION_NAME_PATTERN.test( definition.name )
	) {
		return 'Upload operation names must be strings in the form "namespace/operation-name", like "core/upload".';
	}

	if ( select.getOperation( definition.name ) ) {
		return `Upload operation "${ definition.name }" is already registered.`;
	}

	if ( typeof definition.handler !== 'function' ) {
		return `Upload operation "${ definition.name }" must have a "handler" function.`;
	}

	if ( typeof definition.label !== 'string' || ! definition.label ) {
		return `Upload operation "${ definition.name }" must have a "label" string.`;
	}

	/*
	 * The pool holds the limit, so joining one that does not exist would
	 * leave the step unthrottled while reading as throttled.
	 */
	if (
		definition.concurrency !== undefined &&
		! select.getConcurrencyPool( definition.concurrency )
	) {
		return `Upload operation "${ definition.name }" joins the concurrency pool "${ definition.concurrency }", which is not registered.`;
	}

	return undefined;
}

/**
 * Says why an operation cannot be unregistered, if it cannot.
 *
 * @param name   Operation name.
 * @param select Store selectors.
 *
 * @return The reason, or undefined when the operation can be removed.
 */
export function getUnregisterOperationError(
	name: OperationName,
	select: Pick< RegistrySelect, 'getOperation' | 'getAllItems' >
): string | undefined {
	if ( ! select.getOperation( name ) ) {
		return `Upload operation "${ name }" is not registered.`;
	}

	/*
	 * Queued items carry their pipeline as a list of names. Removing one
	 * out from under them fails every item that reaches the missing step,
	 * and a sideload failing that way takes its parent's already uploaded
	 * attachment with it. Wait for the queue to drain instead.
	 */
	const isInUse = select
		.getAllItems()
		.some(
			( item ) =>
				item.currentOperation === name ||
				item.operations?.some(
					( operation ) => getOperationName( operation ) === name
				)
		);
	if ( isInUse ) {
		return `Upload operation "${ name }" cannot be unregistered while items in the queue still use it.`;
	}

	return undefined;
}

/**
 * Says why a concurrency pool cannot be registered, if it cannot.
 *
 * A limit read from the settings is checked when the pool is consulted,
 * not here: the settings it reads can change afterwards.
 *
 * @param definition Pool definition.
 * @param select     Store selectors.
 *
 * @return The reason, or undefined when the registration can go ahead.
 */
export function getRegisterConcurrencyPoolError(
	definition: ConcurrencyPoolDefinition,
	select: Pick< RegistrySelect, 'getConcurrencyPool' >
): string | undefined {
	if ( typeof definition?.name !== 'string' || ! definition.name ) {
		return 'Concurrency pool names must be non-empty strings, like "upload".';
	}

	if ( select.getConcurrencyPool( definition.name ) ) {
		return `Concurrency pool "${ definition.name }" is already registered.`;
	}

	if (
		typeof definition.limit !== 'function' &&
		! isValidConcurrencyLimit( definition.limit )
	) {
		return `Concurrency pool "${ definition.name }" must have a "limit" that is a positive number, or a function returning one.`;
	}

	return undefined;
}
