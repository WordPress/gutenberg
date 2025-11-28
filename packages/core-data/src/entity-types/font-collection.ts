/**
 * Internal dependencies
 */
import type { Context } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		export interface FontCollection< C extends Context > {
			/**
			 * The collection's slug. This uniquely identifies the collection.
			 */
			slug: string;
			/**
			 * The name of the collection.
			 */
			name: string;
			/**
			 * A description of the collection.
			 */
			description?: string;
			/**
			 * List of font families in this collection.
			 */
			font_families?: CollectionFontFamily[];
			/**
			 * Categories for organizing fonts.
			 */
			categories?: Array< {
				slug: string;
				name: string;
			} >;
		}
	}
}

interface CollectionFontFamily {
	id: string;
	font_family_settings: Record<
		string,
		{
			name: string;
			fontFamily: string;
			slug: string;
			fontFace: {
				src: string;
				fontWeight?: string;
				fontStyle?: string;
				fontFamily?: string;
				preview?: string;
			}[];
			preview: string;
		}
	>;
	categories?: string[];
}

export type FontCollection< C extends Context = 'edit' > =
	_BaseEntityRecords.FontCollection< C >;

export type { _BaseEntityRecords as BaseEntityRecords };
