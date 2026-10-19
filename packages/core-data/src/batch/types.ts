/**
 * A REST API request in a batch.
 */
export interface BatchRequest {
	path: string;
	data?: unknown;
	method?: string;
	headers?: Record< string, string >;
}

/**
 * The outcome of one batched input: its `output`, or its `error`.
 */
export interface BatchResult {
	output?: unknown;
	error?: unknown;
}

/**
 * Processes the inputs of a batch, resolving to one result per input: an
 * object with its `output` or `error`, or the output itself.
 */
export type BatchProcessor< Input > = (
	inputs: Array< Input >
) => Promise< Array< unknown > >;

/**
 * A thunk that adds an input to a batch asynchronously.
 */
export type BatchThunk< Input > = (
	add: ( input: Input ) => Promise< unknown >
) => unknown;

/**
 * The response to the preflight OPTIONS request to /batch/v1.
 */
export interface BatchPreflightResponse {
	endpoints: Array< { args: { requests: { maxItems: number } } } >;
}

/**
 * The response to a batch request.
 */
export interface BatchResponse {
	failed?: string;
	responses: Array< { status: number; body: unknown } >;
}
