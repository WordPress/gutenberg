/**
 * Internal dependencies
 */
import {
	MessageType,
	type CallMessage,
	type ResultMessage,
	type ErrorMessage,
	type RPCMessage,
} from './types';
import { findTransferables } from './transferables';

/**
 * Counter for generating unique call IDs.
 */
let callIdCounter = 0;

/**
 * Generates a unique ID for RPC calls.
 *
 * @return A unique numeric ID.
 */
export function generateCallId(): number {
	return ++callIdCounter;
}

/**
 * Creates a call message for invoking a method on the worker.
 *
 * @param id     - Unique call identifier.
 * @param method - Name of the method to call.
 * @param args   - Arguments to pass to the method.
 * @return The call message object.
 */
export function createCallMessage(
	id: number,
	method: string,
	args: unknown[]
): CallMessage {
	return {
		type: MessageType.CALL,
		id,
		method,
		args,
	};
}

/**
 * Creates a result message for a successful method invocation.
 *
 * @param id     - The call ID this result is for.
 * @param result - The return value from the method.
 * @return The result message object.
 */
export function createResultMessage(
	id: number,
	result: unknown
): ResultMessage {
	return {
		type: MessageType.RESULT,
		id,
		result,
	};
}

/**
 * Creates an error message for a failed method invocation.
 *
 * @param id    - The call ID this error is for.
 * @param error - The error that occurred.
 * @return The error message object.
 */
export function createErrorMessage( id: number, error: unknown ): ErrorMessage {
	let errorInfo: ErrorMessage[ 'error' ];

	if ( error instanceof Error ) {
		errorInfo = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};
	} else {
		errorInfo = {
			message: String( error ),
		};
	}

	return {
		type: MessageType.ERROR,
		id,
		error: errorInfo,
	};
}

/**
 * Type guard to check if a message is an RPC message.
 *
 * @param data - The data to check.
 * @return True if the data is a valid RPC message.
 */
export function isRPCMessage( data: unknown ): data is RPCMessage {
	if ( typeof data !== 'object' || data === null ) {
		return false;
	}

	const msg = data as Record< string, unknown >;

	if ( typeof msg.type !== 'number' || typeof msg.id !== 'number' ) {
		return false;
	}

	switch ( msg.type ) {
		case MessageType.CALL:
			return typeof msg.method === 'string' && Array.isArray( msg.args );
		case MessageType.RESULT:
			return 'result' in msg;
		case MessageType.ERROR:
			return (
				typeof msg.error === 'object' &&
				msg.error !== null &&
				typeof ( msg.error as Record< string, unknown > ).message ===
					'string'
			);
		default:
			return false;
	}
}

/**
 * Posts a message to a target (Worker or self) with automatic transferable detection.
 *
 * @param target  - The Worker or global scope to post to.
 * @param message - The RPC message to send.
 */
export function postRPCMessage(
	target: Worker | typeof globalThis,
	message: RPCMessage
): void {
	// Find transferables in the message.
	const transferables = findTransferables( message );

	if ( 'postMessage' in target && typeof target.postMessage === 'function' ) {
		// Use type assertion because the postMessage signature varies
		// between Worker and DedicatedWorkerGlobalScope.
		(
			target.postMessage as (
				message: unknown,
				transfer: Transferable[]
			) => void
		 )( message, transferables );
	}
}
