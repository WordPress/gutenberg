import type { Context, ContextualField, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface PostStatusObject< C extends Context > {
			/**
			 * The title for the status.
			 */
			name: string;

			/**
			 * Whether posts with this status should be private.
			 */
			private: ContextualField< boolean, 'edit', C >;

			/**
			 * Whether posts with this status should be protected.
			 */
			protected: ContextualField< boolean, 'edit', C >;

			/**
			 * Whether posts of this status should be shown in the front end of the site.
			 */
			public: ContextualField< boolean, 'view' | 'edit', C >;

			/**
			 * Whether posts with this status should be publicly-queryable.
			 */
			queryable: ContextualField< boolean, 'view' | 'edit', C >;

			/**
			 * Whether to include posts in the edit listing for their post type.
			 */
			show_in_list: ContextualField< boolean, 'edit', C >;

			/**
			 * An alphanumeric identifier for the status.
			 */
			slug: string;

			/**
			 * Whether posts of this status may have floating published dates.
			 */
			date_floating: ContextualField< boolean, 'view' | 'edit', C >;
		}
	}
}

export type PostStatusObject< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.PostStatusObject< C >
>;
