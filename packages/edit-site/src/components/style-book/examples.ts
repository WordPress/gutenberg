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
 * Internal dependencies
 */
import type {
	Block,
	BlockExample,
	ColorItem,
	ColorOrigin,
	Duotone,
	MultiOriginPalettes,
} from './types';
import { STYLE_BOOK_COLOR_GROUPS } from './constants';

// Base CSS styles to be applied to color block examples.
const defaultColorExampleStyles = {
	dimensions: { minHeight: '52px' },
	border: {
		width: '1px',
		style: 'solid',
		color: '#ddd', // Match horizontal rule under sub title headings
	},
};

/**
 * Creates an example block to demo a given color item for the Style Book.
 * A color example could be for a simple color, gradient, or duotone filter.
 *
 * @param {ColorItem} color The color for display.
 * @param {string}    type  Type of color e.g. color, gradient, or duotone.
 * @return {Block|undefined} Example block.
 */
function getColorExample( color: ColorItem, type: string ): Block | undefined {
	if ( type === 'colors' ) {
		return createBlock( 'core/group', {
			backgroundColor: color.slug,
			style: defaultColorExampleStyles,
		} );
	}

	if ( type === 'gradients' ) {
		return createBlock( 'core/group', {
			gradient: color.slug,
			style: defaultColorExampleStyles,
		} );
	}

	if ( type === 'duotones' ) {
		return createBlock(
			'core/group',
			{
				layout: {
					type: 'grid',
					columnCount: 2,
					minimumColumnWidth: null,
				},
				style: { spacing: { blockGap: '8px' } },
			},
			[
				createBlock( 'core/image', {
					sizeSlug: 'medium',
					url: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
					aspectRatio: '16/9',
					scale: 'cover',
					style: {
						layout: { columnSpan: 2, rowSpan: 1 },
						color: {
							duotone: `var:preset|duotone|${ color.slug }`,
						},
					},
				} ),
				createBlock( 'core/group', {
					style: {
						...defaultColorExampleStyles,
						color: { background: ( color as Duotone ).colors[ 0 ] },
						dimensions: { minHeight: '20px' },
					},
				} ),
				createBlock( 'core/group', {
					style: {
						...defaultColorExampleStyles,
						color: { background: ( color as Duotone ).colors[ 1 ] },
						dimensions: { minHeight: '20px' },
					},
				} ),
			]
		);
	}
}

/**
 * Returns examples color examples for each origin
 * e.g. Core (Default), Theme, and User.
 *
 * @param {MultiOriginPalettes} colors Global Styles color palettes per origin.
 * @return {BlockExample[]} An array of color block examples.
 */
function getColorExamples( colors: MultiOriginPalettes ): BlockExample[] {
	if ( ! colors ) {
		return [];
	}

	const examples: BlockExample[] = [];

	STYLE_BOOK_COLOR_GROUPS.forEach( ( group ) => {
		const palette = colors[ group.type ].find(
			( origin: ColorOrigin ) => origin.slug === group.origin
		);

		if ( palette?.[ group.type ] ) {
			const example: BlockExample = {
				name: group.slug,
				title: group.title,
				category: 'colors',
				blocks: [
					createBlock(
						'core/group',
						{
							layout: {
								type: 'grid',
								columnCount: 2,
								minimumColumnWidth: null,
							},
							style: {
								spacing: {
									blockGap: { top: '8px', left: '16px' },
								},
							},
						},
						palette[ group.type ].map( ( color: ColorItem ) =>
							getColorExample( color, group.type )
						)
					),
				],
			};
			examples.push( example );
		}
	} );

	return examples;
}

/**
 * Returns a list of examples for registered block types.
 *
 * @param {MultiOriginPalettes} colors Global styles colors grouped by origin e.g. Core, Theme, and User.
 * @return {BlockExample[]} An array of block examples.
 */
export function getExamples( colors: MultiOriginPalettes ): BlockExample[] {
	const nonHeadingBlockExamples = getBlockTypes()
		.filter( ( blockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports?.inserter !== false
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
	const colorExamples = getColorExamples( colors );

	return [ headingsExample, ...colorExamples, ...nonHeadingBlockExamples ];
}
