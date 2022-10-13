/**
 * WordPress dependencies
 */
import { createBlock, hasBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import { removeAspectRatioClasses } from './util';

const { name: EMBED_BLOCK } = metadata;

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ) &&
				node.textContent?.match( /https/gi )?.length === 1,
			transform: ( node ) => {
				return createBlock( EMBED_BLOCK, {
					url: node.textContent.trim(),
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url } ) => !! url,
			transform: ( { url, caption } ) => {
				let value = `<a href="${ url }">${ url }</a>`;
				if ( caption?.trim() ) {
					value += `<br />${ caption }`;
				}
				return createBlock( 'core/paragraph', {
					content: value,
				} );
			},
		},
	],
};

export default transforms;

/**
 * Remove aspect ratio classes when transforming an embed to other block type.
 *
 * @param {Object}   result  The transformed block.
 * @param {Object[]} source  Original blocks transformed.
 * @param {number}   index   Index of the transformed block on the array of results.
 * @param {Object[]} results An array all the blocks that resulted from the transformation.
 * @return {Object} Filtered block transform.
 */
function removeAspectRatioClassesDuringTransform(
	result,
	source,
	index,
	results
) {
	if ( ! hasBlockSupport( result.name, 'customClassName', true ) ) {
		return result;
	}

	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the class should not be kept.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the class during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are in presence of transform between one or more block in the source
	// that have one or more blocks in the result
	// we apply the class on source N to the result N,
	// if source N does not exists we do nothing.
	if ( source[ index ] && 'core/embed' === source[ index ].name ) {
		const originClassName = source[ index ]?.attributes.className;
		if ( originClassName ) {
			return {
				...result,
				attributes: {
					...result.attributes,
					className: removeAspectRatioClasses( originClassName ),
				},
			};
		}
	}
	return result;
}

// run after `core/color/addTransforms` filter from custom-class-name support.
addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/embed/removeAspectRatioClassesDuringTransform',
	removeAspectRatioClassesDuringTransform,
	15
);
