/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	getCategories,
	getBlockType,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import { __experimentalGetCoreBlocks } from '@wordpress/block-library';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useMemo, useState, memo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { STYLE_BOOK_CATEGORIES, STYLE_BOOK_THEME_SUBCATEGORIES } from './constants';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

const {
	ExperimentalBlockEditorProvider,
	useGlobalStyle,
	GlobalStylesContext,
	useGlobalStylesOutputWithConfig,
} = unlock( blockEditorPrivateApis );

/*
	// This hook will get all block examples,
	// and group them by category.
	- get all registered block examples. See current getExamples()
	- build any adhoc examples.
	STYLE_BOOK_CATEGORIES

 */

function getCustomExamples() {
	const customExamples = [
		{
			name: 'custom/colors',
			title: __( 'Colors' ),
			category: 'colors',
			blocks: [
				createBlock( 'core/group', {
					attributes: {
						layout: {
							type: 'grid',
							columnCount: 3,
						},
					},
					innerBlocks: [
						createBlock( 'core/group', {
							style: {
								layout: {
									selfStretch: 'fill',
								},
							},
							layout: {
								type: 'constrained',
							},
						} ),
					],
				} ),
			],
		},
	];
}

// @TODO get other registered categories (aside from what's in STYLE_BOOK_CATEGORIES)
// And their subcategories.
export function getBlockCategories( examples ) {
	const reservedCategories = [
		...STYLE_BOOK_THEME_SUBCATEGORIES,
		...STYLE_BOOK_CATEGORIES,
	].map( ( category ) => category.category );

	return getCategories()
		.filter(
			( category ) =>
				! reservedCategories.includes( category.slug ) &&
				examples.some(
					( example ) => example.category === category.slug
				)
		)
		.map( ( category ) => ( {
			name: category.slug,
			title: category.title,
		} ) );
}

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
	/*
	 * Use our own example for the Heading block so that we can show multiple
	 * heading levels.
	 */
	const headingsExample = !! getBlockType( 'core/heading' )
		? {
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
		  }
		: {};

	return [ headingsExample, ...nonHeadingBlockExamples ];
}

export function getCategoryExamples( categoryDefinition, examples ) {
	if ( ! categoryDefinition?.name || ! examples?.length ) {
		return [];
	}

	if ( categoryDefinition?.subcategories?.length ) {
		return categoryDefinition.subcategories.reduce(
			( acc, subCategory ) => ( {
				...acc,
				...getCategoryExamples( subCategory, examples ),
			} ),
			{}
		);
	}

	const blocksToInclude = categoryDefinition?.blocks || [];
	const blocksToExclude = categoryDefinition?.exclude || [];

	return {
		[ categoryDefinition.name ]: {
			title: categoryDefinition.title,
			examples: examples.filter( ( example ) => {
				return (
					! blocksToExclude.includes( example.name ) &&
					( example.category === categoryDefinition.name ||
						blocksToInclude.includes( example.name ) )
				);
			} ),
		},
	};
}

/*




 */
