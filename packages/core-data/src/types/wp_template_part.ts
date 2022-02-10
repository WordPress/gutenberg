/**
 * Internal dependencies
 */
import { EntityRecordWithRawData, PostStatus, TemplateContent } from './common';

export interface WpTemplatePart< RawType > extends EntityRecordWithRawData {
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
	content: TemplateContent;
	/**
	 * Title of template.
	 */
	title: RawType;
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
	has_theme_file: {
		[ k: string ]: string;
	};
	/**
	 * The ID for the author of the template.
	 */
	author: number;
	/**
	 * Where the template part is intended for use (header, footer, etc.)
	 */
	area: string;
}
