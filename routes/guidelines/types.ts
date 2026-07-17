/**
 * Types for the Guidelines feature.
 */

import type { ReactNode } from 'react';

/**
 * A guideline scope from the `/wp/v2/knowledge/guideline-scopes` registry.
 */
export interface Scope {
	slug: string;
	title: string;
	description: string;
	order: number;
}

/**
 * A resolved guideline row (scope or block), indexed by slug.
 */
export interface GuidelineRow {
	id: number;
	content: string;
}

/**
 * The minimal block-type shape the Guidelines UI reads from the block registry.
 */
export interface ContentBlock {
	name: string;
	title: string;
	icon?: { src?: unknown };
}

/**
 * The collection query used to read guideline rows by slug.
 *
 * Note: no `context` is set here on purpose. The `wp_knowledge` (postType)
 * entity already fetches with `context: 'edit'` via its `baseURLParams`, so the
 * response includes raw field values. Passing `context: 'edit'` in the query
 * instead would store rows under the `edit` cache bucket, where
 * `editEntityRecord`/`getRawEntityRecord` (which read the `default` bucket)
 * can't find them — breaking edits of rows loaded after a page refresh.
 */
export interface GuidelineQuery {
	slug: string[];
	status: string[];
	per_page: number;
}

export interface GuidelineAccordionProps {
	title: string;
	description: string;
	children: ReactNode;
}

/**
 * The on-disk import/export JSON shape (unchanged from the singleton era so
 * existing files round-trip). Flat scopes carry `{ guidelines }`; `blocks` is a
 * map of block name to `{ guidelines }`.
 */
export interface GuidelineImportData {
	guideline_categories: Record< string, unknown >;
}
