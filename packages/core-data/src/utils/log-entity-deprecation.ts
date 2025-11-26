/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { deprecatedEntities } from '../entities';

let loggedAlready = false;

/**
 * Logs a deprecation warning for an entity, if it's deprecated.
 *
 * @param kind                            The kind of the entity.
 * @param name                            The name of the entity.
 * @param functionName                    The name of the function that was called with a deprecated entity.
 * @param options                         The options for the deprecation warning.
 * @param options.alternativeFunctionName The name of the alternative function that should be used instead.
 * @param options.isShorthandSelector     Whether the function is a shorthand selector.
 */
export default function logEntityDeprecation(
	kind: string,
	name: string,
	functionName: string,
	{
		alternativeFunctionName,
		isShorthandSelector = false,
	}: {
		alternativeFunctionName?: string;
		isShorthandSelector?: boolean;
	} = {}
) {
	const deprecation = deprecatedEntities[ kind ]?.[ name ];
	if ( ! deprecation ) {
		return;
	}

	if ( ! loggedAlready ) {
		const { alternative } = deprecation;

		const message = isShorthandSelector
			? `'${ functionName }'`
			: `The '${ kind }', '${ name }' entity (used via '${ functionName }')`;

		let alternativeMessage = `the '${ alternative.kind }', '${ alternative.name }' entity`;
		if ( alternativeFunctionName ) {
			alternativeMessage += ` via the '${ alternativeFunctionName }' function`;
		}

		deprecated( message, {
			...deprecation,
			alternative: alternativeMessage,
		} );
	}

	// Only log an entity deprecation once per call stack,
	// else there's spurious logging when selections or actions call through to other selectors or actions.
	// Note: this won't prevent the deprecation warning being logged if a selector or action makes an async call
	// to another selector or action, but this is probably the best we can do.
	loggedAlready = true;
	// At the end of the call stack, reset the flag.
	setTimeout( () => {
		loggedAlready = false;
	}, 0 );
}
