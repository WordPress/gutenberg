/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		export interface PostStatusObject< C extends Context > {
			/**
			 * The title for the status.
			 */
			name: string;

			/**
			 * Whether posts with this status should be private.
			 */
			private: boolean;

			/**
			 * Whether posts with this status should be protected.
			 */
			protected: boolean;

			/**
			 * Whether posts of this status should be shown in the front end of the site.
			 */
			public: boolean;

			/**
			 * Whether posts with this status should be publicly-queryable.
			 */
			queryable: boolean;

			/**
			 * Whether to include posts in the edit listing for their post type.
			 */
			show_in_list: boolean;

			/**
			 * An alphanumeric identifier for the status.
			 */
			slug: string;

			/**
			 * Whether posts of this status may have floating published dates.
			 */
			date_floating: boolean;
		}
	}
}

export type PostStatusObject< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.PostStatusObject< C >
>;
