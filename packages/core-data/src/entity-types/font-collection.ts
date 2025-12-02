/**
 * Internal dependencies
 */
import type { Context } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';
import type { FontFace, FontFamily } from './font-family';

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

/**
 * Collection wrapper for REST API font family responses.
 */
export interface CollectionFontFamily {
	id: string;
	font_family_settings: FontFamily;
	categories?: string[];
	_embedded?: {
		font_faces?: CollectionFontFace[];
	};
}

/**
 * Collection wrapper for REST API font face responses.
 */
export interface CollectionFontFace {
	id: string;
	font_face_settings: FontFace;
}

export type FontCollection< C extends Context = 'edit' > =
	_BaseEntityRecords.FontCollection< C >;

export type { _BaseEntityRecords as BaseEntityRecords };
