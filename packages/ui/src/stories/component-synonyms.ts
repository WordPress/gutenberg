/**
 * Search synonyms for `@wordpress/ui` components in Storybook.
 *
 * Keys must match each story file's `title` meta. Consumed by
 * `storybook/scripts/patch-manager-search.mjs` so components are discoverable
 * by common terms (e.g. "form" finds Input).
 */
import synonyms from './component-synonyms.json';

export const UI_COMPONENT_SYNONYMS: Record< string, readonly string[] > =
	synonyms;
