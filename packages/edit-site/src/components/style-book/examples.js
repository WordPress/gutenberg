/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	getBlockType,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';

/**
 * blockExamples object.
 *
 * @typedef {Object} blockExamples
 *
 * @property {string} name     Block name, e.g., "core/paragraph".
 * @property {string} title    Block title/label.
 * @property {string} category Block category.
 * @property {Object} blocks   Block object.
 */

/**
 * Returns a list of examples for registered block types.
 *
 * @return {Array<blockExamples>} An array of block examples.
 */
export function getExamples() {
	const nonHeadingBlockExamples = getBlockTypes()
		.filter( ( blockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports.inserter !== false
			);
		} )
		.map( ( blockType ) => ( {
			name: blockType.name,
			title: blockType.title,
			category: blockType.category,
			blocks: getBlockFromExample( blockType.name, blockType.example ),
		} ) );

	const isHeadingBlockRegistered = !! getBlockType( 'core/heading' );

	if ( ! isHeadingBlockRegistered ) {
		return nonHeadingBlockExamples;
	}

	// Use our own example for the Heading block so that we can show multiple
	// heading levels.
	const headingsExample = {
		name: 'core/heading',
		title: __( 'Headings' ),
		category: 'text',
		blocks: [ 1, 2, 3, 4, 5, 6 ].map( ( level ) => {
			return createBlock( 'core/heading', {
				content: sprintf(
					// translators: %d: heading level e.g: "1", "2", "3"
					__( 'Heading %d' ),
					level
				),
				level,
			} );
		} ),
	};

	return [ headingsExample, ...nonHeadingBlockExamples ];
}
