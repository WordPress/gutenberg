/**
 * Internal dependencies
 */
import type {
	Context,
	PostStatus,
	RenderedText,
	OmitNevers,
	ContextualField,
} from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface WpTemplate< C extends Context > {
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
			 *
			 * This field never has a `rendered` property when reading but still uses
			 * the RenderedText type so it can be set as a string when sending updates to
			 * the server.
			 *
			 * TODO: Figure out how to mesh this with `RenderedText<C>`
			 */
			content: ContextualField<
				RenderedText< C > & {
					/**
					 * Version of the content block format used by the template.
					 */
					block_version: ContextualField< number, 'edit', C >;
				},
				'view' | 'edit',
				C
			>;
			/**
			 * Title of template.
			 */
			title: RenderedText< 'edit' >;
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
			 * Plugin that registered the template.
			 */
			plugin?: string;
			/**
			 * Theme file exists.
			 */
			has_theme_file: Record< string, string >;
			/**
			 * The ID for the author of the template.
			 */
			author: number;
			/**
			 * Whether a template is a custom template.
			 */
			is_custom: Record< string, string >;
			/**
			 * The date the template was last modified, in the site's timezone.
			 */
			modified: ContextualField< string, 'view' | 'edit', C >;
		}
	}
}

export type WpTemplate< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.WpTemplate< C >
>;
