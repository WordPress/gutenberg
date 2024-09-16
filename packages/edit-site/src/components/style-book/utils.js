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
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useMemo, useState, memo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { STYLE_BOOK_CATEGORIES } from './constants';
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
		: [];

	return [ nonHeadingBlockExamples, ...headingsExample ];
}

export function getCategoryExamples( category, examples ) {
	if ( ! category || ! examples ) {
		return [];
	}

	if ( category?.subCategories ) {
		return category.subCategories.reduce(
			( acc, subCategory ) => ( {
				...acc,
				...getCategoryExamples( subCategory.category, examples ),
			} ),
			{}
		);
	}

	const { include, exclude } = category;

	return {
		[ category.category ]: {
			label: category.label,
			examples: examples.filter( ( example ) => {
				return (
					! exclude.includes( example.name ) &&
					( example.category === category ||
						include.includes( example.name ) )
				);
			} ),
		},
	};
}

/*




 */
