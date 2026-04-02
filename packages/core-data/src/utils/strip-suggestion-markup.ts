/**
 * Strip suggestion markup (`<ins>` and `<del>` tags with suggestion classes)
 * from an HTML string. This is used before saving to the REST API to ensure
 * that suggestion annotations do not persist to the database.
 *
 * - `<ins class="wp-suggestion-insert">text</ins>` → `text` (keep the content)
 * - `<del class="wp-suggestion-delete">text</del>` → `` (remove the content)
 *
 * @param html The HTML string that may contain suggestion markup.
 * @return Clean HTML without suggestion markup.
 */
export function stripSuggestionMarkup( html: string ): string {
	if (
		! html ||
		( ! html.includes( 'wp-suggestion-insert' ) &&
			! html.includes( 'wp-suggestion-delete' ) )
	) {
		return html;
	}

	// Remove <del class="wp-suggestion-delete">...</del> entirely (reject deletions).
	let result = html.replace(
		/<del\s+class="wp-suggestion-delete"[^>]*>[\s\S]*?<\/del>/g,
		''
	);

	// Unwrap <ins class="wp-suggestion-insert">...</ins> (accept insertions).
	result = result.replace(
		/<ins\s+class="wp-suggestion-insert"[^>]*>([\s\S]*?)<\/ins>/g,
		'$1'
	);

	return result;
}
