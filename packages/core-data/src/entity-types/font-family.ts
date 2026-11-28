import type { Context, ContextualField, OmitNevers } from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/**
		 * Font Family post type (wp_font_family)
		 */
		export interface WpFontFamily< C extends Context > {
			/**
			 * Unique identifier for the font family.
			 */
			id: number;
			/**
			 * Version of the theme.json schema used for the typography settings.
			 */
			theme_json_version: number;
			/**
			 * The IDs of the child font faces in the font family.
			 */
			font_faces: number[];
			/**
			 * Font family settings as a JSON object (camelCase properties). The
			 * family's name and slug live here.
			 */
			font_family_settings: FontFamily;
			/**
			 * Embedded font faces (when using _embed parameter).
			 */
			_embedded?: ContextualField<
				{
					font_faces?: Array< {
						id: string;
						font_face_settings: FontFace;
					} >;
				},
				'view' | 'edit',
				C
			>;
		}
	}
}

/**
 * Font family type in Theme.JSON format.
 */
export interface FontFamily {
	name: string;
	slug: string;
	fontFamily: string;
	fontFace?: FontFace[];
	preview?: string;
	id?: string;
	source?: string;
	version?: string;
	author?: string;
	license?: string;
	description?: string;
	tags?: string[];
	variants?: FontFace[];
	category?: string;
}

/**
 * Font face type for use in components.
 * This matches the shape in font_face_settings.
 */
export interface FontFace {
	fontFamily: string;
	fontStyle?: string;
	fontWeight?: string | number;
	src?: string | string[];
	preview?: string;
	id?: string;
	fontDisplay?: string;
	fontStretch?: string;
	fontVariant?: string;
	fontFeatureSettings?: string;
	fontVariationSettings?: string;
	unicodeRange?: string;
}

export type WpFontFamily< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.WpFontFamily< C >
>;

export type { _BaseEntityRecords as BaseEntityRecords };
