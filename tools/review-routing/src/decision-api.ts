import type { RoutingRule } from './routing-rules.ts';

/**
 * A decision API that accepts System One requests, such as Jev, or Clef on
 * Cloudflare Workers AI.
 */
export type DecisionApi = {
	/** Full endpoint URL. */
	url: string;
	/** Sent as a bearer token. */
	apiKey: string;
};

export type DecisionRequest = {
	model: string;
	state: string;
	questions: Record< string, { type: 'noul'; instructions: string } >;
};

type DecisionResponse = {
	answers?: Record< string, unknown >;
};

/* Cloudflare wraps every response in an envelope. Other providers do not. */
type CloudflareEnvelope = {
	success: boolean;
	errors?: unknown;
	result?: DecisionResponse;
};

/* The first request to a cold model can take close to a minute. */
const TIMEOUT_MS = 120_000;

/**
 * Builds a request with one yes or no question for each routing rule.
 *
 * @param state Evidence for the model to read.
 * @param rules Routing rules.
 * @param model Model name.
 * @return The request body.
 */
export function buildRequest(
	state: string,
	rules: RoutingRule[],
	model: string
): DecisionRequest {
	return {
		model,
		state,
		questions: Object.fromEntries(
			rules.map( ( rule ) => [
				rule.id,
				{ type: 'noul', instructions: rule.instructions },
			] )
		),
	};
}

/**
 * Reads the probability from one answer, `{ "type": "noul", "noul": 0.99 }`.
 *
 * @param id     Question id.
 * @param answer Answer from the model.
 * @return The probability.
 */
export function readProbability( id: string, answer: unknown ): number {
	const value = ( answer as { noul?: unknown } | undefined )?.noul;

	if ( typeof value !== 'number' || value < 0 || value > 1 ) {
		throw new Error(
			`Unexpected answer for "${ id }": ${ JSON.stringify( answer ) }`
		);
	}

	return value;
}

/**
 * Takes the answers out of a response body, with or without a Cloudflare
 * envelope. Fails closed: a decision is only as good as a successful answer.
 *
 * @param body Parsed response body.
 * @return The answers.
 */
export function readAnswers( body: unknown ): Record< string, unknown > {
	let response = body as DecisionResponse;

	if ( typeof body === 'object' && body !== null && 'success' in body ) {
		const envelope = body as CloudflareEnvelope;
		if ( envelope.success !== true ) {
			throw new Error(
				`The decision API failed: ${ JSON.stringify( envelope.errors ) }`
			);
		}
		response = envelope.result ?? {};
	}

	return response?.answers ?? {};
}

/**
 * Asks the model and returns a probability for each question.
 *
 * @param request Request body.
 * @param api     Endpoint and key.
 * @return Probabilities, keyed by question id.
 */
export async function ask(
	request: DecisionRequest,
	api: DecisionApi
): Promise< Record< string, number > > {
	const response = await fetch( api.url, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${ api.apiKey }`,
			'content-type': 'application/json',
		},
		body: JSON.stringify( request ),
		signal: AbortSignal.timeout( TIMEOUT_MS ),
	} );

	if ( ! response.ok ) {
		throw new Error(
			`The decision API responded ${
				response.status
			}: ${ await response.text() }`
		);
	}

	const answers = readAnswers( await response.json() );

	return Object.fromEntries(
		Object.keys( request.questions ).map( ( id ) => [
			id,
			readProbability( id, answers[ id ] ),
		] )
	);
}
