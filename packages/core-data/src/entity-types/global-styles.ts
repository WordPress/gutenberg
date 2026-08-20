import type {
	Context,
	ContextualField,
	OmitNevers,
	RenderedText,
} from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface GlobalStyles< C extends Context > {
			/**
			 * Unique identifier for the global styles record.
			 */
			id: string;
			/**
			 * The title of the global styles variation.
			 */
			title: RenderedText< C >;
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
