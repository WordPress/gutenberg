/**
 * Internal dependencies
 */
import { Context, PostStatus, RawField, OmitNevers } from './common';

interface FullWpTemplatePart< C extends Context > {
	/**
	 * ID of template.
	 */
	id: string;
	/**
	 * Unique slug identifying the template.
	 */
	slug: string;
	/**
	 * Theme identifier for the template.
	 */
	theme: string;
	/**
	 * Type of template.
	 */
	type: string;
	/**
	 * Source of template
	 */
	source: string;
	/**
	 * Source of a customized template
	 */
	origin: string;
	/**
	 * Content of template.
	 */
	content:
		| {
				/**
				 * Content for the template, as it exists in the database.
				 */
				raw?: string;
				/**
				 * Version of the content block format used by the template.
				 */
				block_version?: number;
		  }
		| string;
	/**
	 * Title of template.
	 */
	title: RawField< 'edit' > | string;
	/**
	 * Description of template.
	 */
	description: string;
	/**
	 * Status of template.
	 */
	status: PostStatus;
	/**
	 * Post ID.
	 */
	wp_id: number;
	/**
	 * Theme file exists.
	 */
	has_theme_file: Record< string, string >;
	/**
	 * The ID for the author of the template.
	 */
	author: number;
	/**
	 * Where the template part is intended for use (header, footer, etc.)
	 */
	area: string;
}

export type WpTemplatePart< C extends Context > = OmitNevers<
	FullWpTemplatePart< C >
>;
