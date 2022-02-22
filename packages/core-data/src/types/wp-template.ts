/**
 * Internal dependencies
 */
import {
	Context,
	PostStatus,
	RenderedText,
	OmitNevers,
	ContextualField,
} from './helpers';

import { CoreBaseEntityTypes as _CoreBaseEntityTypes } from './wp-base-types';

declare module './wp-base-types' {
	export namespace CoreBaseEntityTypes {
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
		}
	}
}

export type WpTemplate< C extends Context > = OmitNevers<
	_CoreBaseEntityTypes.WpTemplate< C >
>;
