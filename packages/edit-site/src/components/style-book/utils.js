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

// Get all examples from every registered block.
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

// Get examples for a given category.
export function getCategoryExamples( categoryDefinition, examples ) {
	if ( ! categoryDefinition?.name || ! examples?.length ) {
		return [];
	}

	if ( categoryDefinition?.subcategories?.length ) {
		return categoryDefinition.subcategories.reduce(
			( acc, subcategory ) => {
				acc.subcategories.push(
					getCategoryExamples( subcategory, examples )
				);
				return acc;
			},
			{
				title: categoryDefinition.title,
				name: categoryDefinition.name,
				subcategories: [],
			}
		);
	}

	const blocksToInclude = categoryDefinition?.blocks || [];
	const blocksToExclude = categoryDefinition?.exclude || [];

	return {
		title: categoryDefinition.title,
		name: categoryDefinition.name,
		examples: examples.filter( ( example ) => {
			return (
				! blocksToExclude.includes( example.name ) &&
				( example.category === categoryDefinition.name ||
					blocksToInclude.includes( example.name ) )
			);
		} ),
	};
}

/*




 */
