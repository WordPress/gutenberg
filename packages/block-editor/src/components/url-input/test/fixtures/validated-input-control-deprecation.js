/**
 * Temporary test helper while `URLInput` still unlocks the deprecated private
 * `ValidatedInputControl` from `@wordpress/components`.
 *
 * DELETE this file (and remove its imports) once `URLInput` migrates to
 * `@wordpress/ui` `ValidatedInputControl`.
 */

export const VALIDATED_INPUT_CONTROL_DEPRECATION =
	'wp.components.privateApis.ValidatedInputControl is deprecated since version 7.2. Please use ValidatedInputControl from @wordpress/ui instead. Note: This private API will be completely removed within a few Gutenberg plugin releases.';

/**
 * Asserts the expected deprecation warning when URL validation rendered the
 * private `ValidatedInputControl`. No-op when validation did not run.
 */
export function expectValidatedInputControlDeprecationIfCalled() {
	// eslint-disable-next-line no-console -- jest-console mock inspection.
	const deprecationCalls = console.warn.mock.calls.filter(
		( [ message ] ) => message === VALIDATED_INPUT_CONTROL_DEPRECATION
	);

	if ( deprecationCalls.length > 0 ) {
		expect( console ).toHaveWarnedWith(
			VALIDATED_INPUT_CONTROL_DEPRECATION
		);
	}
}
