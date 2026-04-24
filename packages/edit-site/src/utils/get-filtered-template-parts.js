/**
 * WordPress dependencies
 */
import { isTemplatePart } from '@wordpress/blocks';

const EMPTY_ARRAY = [];

/**
 * Get a flattened and filtered list of template parts and the matching block for that template part.
 *
 * Takes a list of blocks defined within a template, and a list of template parts, and returns a
 * flattened list of template parts and the matching block for that template part.
 *
 * @param {Array}  blocks        Blocks to flatten.
 * @param {?Array} templateParts Available template parts.
 * @return {Array} An array of template parts and their blocks.
 */
export default function getFilteredTemplatePartBlocks(
	blocks = EMPTY_ARRAY,
	templateParts
) {
	const templatePartsById = templateParts
		? // Key template parts by their ID.
		  templateParts.reduce(
				( newTemplateParts, part ) => ( {
					...newTemplateParts,
					[ part.id ]: part,
				} ),
				{}
		  )
		: {};

	const result = [];

	// Iterate over all blocks, recursing into inner blocks.
	// Output will be based on a depth-first traversal.
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		// Place inner blocks at the beginning of the stack to preserve order.
		stack.unshift( ...innerBlocks );

		if ( isTemplatePart( block ) ) {
			const {
				attributes: { theme, slug },
			} = block;
			const templatePartId = `${ theme }//${ slug }`;
			const templatePart = templatePartsById[ templatePartId ];

			// Only add to output if the found template part block is in the list of available template parts.
			if ( templatePart ) {
				result.push( {
					templatePart,
					block,
				} );
			}
		}
	}

	return result;
}
