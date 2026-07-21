/**
 * Merges space-separated `rel` tokens into an existing value, deduplicating.
 *
 * @param {string | undefined}    rel    - Existing `rel` attribute value, if any.
 * @param {ReadonlyArray<string>} tokens - Tokens to ensure are present.
 * @return {string} Deduplicated `rel` string.
 */
export function ensureRelTokens(
	rel: string | undefined,
	tokens: readonly string[]
): string {
	const merged = new Set(
		`${ rel ?? '' } ${ tokens.join( ' ' ) }`
			.trim()
			.split( /\s+/ )
			.filter( Boolean )
	);

	return [ ...merged ].join( ' ' );
}
