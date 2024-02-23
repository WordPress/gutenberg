/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from './create-template-part-id';

/**
 * This maps the properties of a template part to those of a block pattern.
 * @param {Object} templatePart
 * @return {Object} The template part in the shape of block pattern.
 */
export function mapTemplatePartToBlockPattern( templatePart ) {
	return {
		name: createTemplatePartId( templatePart.theme, templatePart.slug ),
		title: templatePart.title.rendered,
		blocks: parse( templatePart.content.raw ),
		templatePart,
	};
}
