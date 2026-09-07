import type { Pattern } from './types.ts';

/**
 * The design system pattern documents.
 *
 * Patterns are authored as MDX under
 * `storybook/stories/design-system/patterns` and are served to agents from
 * those same source files, so that a single document serves both audiences.
 *
 * The index is maintained here rather than derived from the documents because
 * a document's title can be declared indirectly (`<Meta of={ … } />`), leaving
 * no readable title in the source. `src/test/patterns.ts` fails if this list
 * and the directory contents fall out of sync.
 */
export const PATTERNS: Pattern[] = [
	{
		slug: 'destructive-actions',
		title: 'Destructive Actions',
		description:
			'How to present actions that remove, delete, or permanently alter content. Includes the decision tree for choosing between no confirmation, `ConfirmDialog`, and a `Modal` with a destructive button.',
	},
	{
		slug: 'error-messages',
		title: 'Error Messages',
		description:
			'How to write an error message that explains what happened, why, and what the user can do next.',
	},
	{
		slug: 'save-and-submit',
		title: 'Save & Submit',
		description:
			'How to save settings and submit forms, including choosing between autosave and manual save for a surface.',
	},
];

/**
 * Find a pattern by slug.
 *
 * @param slug - The pattern slug (case-insensitive).
 * @return The pattern, or null if not found.
 */
export function findPattern( slug: string ): Pattern | null {
	const normalized = slug.trim().toLowerCase();
	return PATTERNS.find( ( pattern ) => pattern.slug === normalized ) ?? null;
}
