import { parse } from '@wordpress/blocks';
import type { WpTemplatePart } from '@wordpress/core-data';
import { createTemplatePartId } from './create-template-part-id';

/**
 * This maps the properties of a template part to those of a block pattern.
 *
 * @param templatePart
 * @return The template part in the shape of block pattern.
 */
export function mapTemplatePartToBlockPattern( templatePart: WpTemplatePart ) {
	return {
		name: createTemplatePartId( templatePart.theme, templatePart.slug )!,
		title:
			typeof templatePart.title === 'string'
				? templatePart.title
				: templatePart.title.rendered,
		blocks: parse( templatePart.content.raw ),
		templatePart,
	};
}
