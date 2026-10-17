import type { Context, ContextualField, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface GlobalStyles< C extends Context > {
			/**
			 * Unique identifier for the global styles record.
			 */
			id: number;
			/**
			 * The title of the global styles variation.
			 *
			 * Not a `RenderedText`: the global styles controller places both
			 * `raw` and `rendered` in every context, where the posts
			 * controller keeps `raw` to `edit`.
			 */
			title: {
				raw: string;
				rendered: string;
			};
			/**
			 * The styles the variation applies.
			 */
			styles: ContextualField<
				Record< string, Object >,
				'view' | 'edit',
				C
			>;
			/**
			 * The settings the variation applies.
			 */
			settings: ContextualField<
				Record< string, Object >,
				'view' | 'edit',
				C
			>;
			/**
			 * Links the REST response attaches to the record. `version-history`
			 * carries the revision count, which is how consumers tell whether
			 * the record has revisions without fetching them.
			 */
			_links?: {
				'version-history'?: Array< {
					href: string;
					count: number;
				} >;
				[ key: string ]: Array< { href: string } > | undefined;
			};
		}
	}
}

export type GlobalStyles< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.GlobalStyles< C >
>;

/**
 * Fields accepted when updating a global styles record.
 *
 * Updates target an existing record, so its ID is required.
 * The REST API returns the title as raw and rendered text, but also accepts a
 * plain string when updating it.
 */
export type GlobalStylesUpdate = Pick< GlobalStyles< 'edit' >, 'id' > &
	Omit< Partial< GlobalStyles< 'edit' > >, 'id' | 'title' > & {
		title?: GlobalStyles< 'edit' >[ 'title' ] | string;
	};
