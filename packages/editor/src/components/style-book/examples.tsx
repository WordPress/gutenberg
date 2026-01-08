/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	getBlockType,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
	// @wordpress/blocks imports are not typed.
	// @ts-expect-error
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import type {
	BlockExample,
	ColorOrigin,
	MultiOriginPalettes,
	BlockType,
} from './types';
import ColorExamples from './color-examples';
import DuotoneExamples from './duotone-examples';
import { STYLE_BOOK_COLOR_GROUPS } from './constants';

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
		const palette = colors[ group.type as keyof MultiOriginPalettes ];
		const paletteFiltered = Array.isArray( palette )
			? palette.find(
					( origin: ColorOrigin ) => origin.slug === group.origin
			  )
			: undefined;

		if ( paletteFiltered?.[ group.type ] ) {
			const example: BlockExample = {
				name: group.slug,
				title: group.title,
				category: 'colors',
			};
			if ( group.type === 'duotones' ) {
				example.content = (
					<DuotoneExamples
						duotones={ paletteFiltered[ group.type ] }
					/>
				);
				examples.push( example );
			} else {
				example.content = (
					<ColorExamples
						colors={ paletteFiltered[ group.type ] }
						type={ group.type }
					/>
				);
				examples.push( example );
			}
		}
	} );

	return examples;
}

/**
 * Returns examples for the overview page.
 *
 * @param {MultiOriginPalettes} colors Global Styles color palettes per origin.
 * @return {BlockExample[]} An array of block examples.
 */
function getOverviewBlockExamples(
	colors: MultiOriginPalettes
): BlockExample[] {
	const examples: BlockExample[] = [];

	// Get theme palette from colors if they exist.
	const themePalette = Array.isArray( colors?.colors )
		? colors.colors.find(
				( origin: ColorOrigin ) => origin.slug === 'theme'
		  )
		: undefined;

	if ( themePalette ) {
		const themeColorexample: BlockExample = {
			name: 'theme-colors',
			title: __( 'Colors' ),
			category: 'overview',
			content: (
				<ColorExamples
					colors={ themePalette.colors }
					type="colors"
					templateColumns="repeat(auto-fill, minmax( 200px, 1fr ))"
					itemHeight="32px"
				/>
			),
		};

		examples.push( themeColorexample );
	}

	// Get examples for typography blocks.
	const typographyBlockExamples: BlockType[] = [];

	if ( getBlockType( 'core/heading' ) ) {
		const headingBlock = createBlock( 'core/heading', {
			// translators: Typography example. Your local alphabet, numbers and some common special characters.
			content: __(
				`AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789X{(…)},.-<>?!*&:/A@HELFO™©`
			),
			level: 1,
		} );
		typographyBlockExamples.push( headingBlock );
	}

	if ( getBlockType( 'core/paragraph' ) ) {
		const firstParagraphBlock = createBlock( 'core/paragraph', {
			content: __(
				`A paragraph in a website refers to a distinct block of text that is used to present and organize information. It is a fundamental unit of content in web design and is typically composed of a group of related sentences or thoughts focused on a particular topic or idea. Paragraphs play a crucial role in improving the readability and user experience of a website. They break down the text into smaller, manageable chunks, allowing readers to scan the content more easily.`
			),
		} );
		const secondParagraphBlock = createBlock( 'core/paragraph', {
			content: __(
				`Additionally, paragraphs help structure the flow of information and provide logical breaks between different concepts or pieces of information. In terms of formatting, paragraphs in websites are commonly denoted by a vertical gap or indentation between each block of text. This visual separation helps visually distinguish one paragraph from another, creating a clear and organized layout that guides the reader through the content smoothly.`
			),
		} );

		if ( getBlockType( 'core/group' ) ) {
			const groupBlock = createBlock(
				'core/group',
				{
					layout: {
						type: 'grid',
						columnCount: 2,
						minimumColumnWidth: '12rem',
					},
					style: {
						spacing: {
							blockGap: '1.5rem',
						},
					},
				},
				[ firstParagraphBlock, secondParagraphBlock ]
			);
			typographyBlockExamples.push( groupBlock );
		} else {
			typographyBlockExamples.push( firstParagraphBlock );
		}
	}

	if ( !! typographyBlockExamples.length ) {
		examples.push( {
			name: 'typography',
			title: __( 'Typography' ),
			category: 'overview',
			blocks: typographyBlockExamples,
		} );
	}

	const otherBlockExamples = [
		'core/image',
		'core/separator',
		'core/buttons',
		'core/quote',
		'core/search',
	];

	// Get examples for other blocks and put them in order of above array.
	otherBlockExamples.forEach( ( blockName ) => {
		const blockType = getBlockType( blockName );
		if ( blockType && blockType.example ) {
			const blockExample: BlockExample = {
				name: blockName,
				title: blockType.title,
				category: 'overview',
				/*
				 * CSS generated from style attributes will take precedence over global styles CSS,
				 * so remove the style attribute from the example to ensure the example
				 * demonstrates changes to global styles.
				 */
				blocks: getBlockFromExample( blockName, {
					...blockType.example,
					attributes: {
						...blockType.example.attributes,
						style: undefined,
					},
				} ),
			};
			examples.push( blockExample );
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
		.filter( ( blockType: BlockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports?.inserter !== false
			);
		} )
		.map( ( blockType: BlockType ) => ( {
			name: blockType.name,
			title: blockType.title,
			category: blockType.category,
			/*
			 * CSS generated from style attributes will take precedence over global styles CSS,
			 * so remove the style attribute from the example to ensure the example
			 * demonstrates changes to global styles.
			 */
			blocks: getBlockFromExample( blockType.name, {
				...blockType.example,
				attributes: {
					...blockType.example.attributes,
					style: undefined,
				},
			} ),
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

	const overviewBlockExamples = getOverviewBlockExamples( colors );

	return [
		headingsExample,
		...colorExamples,
		...nonHeadingBlockExamples,
		...overviewBlockExamples,
	];
}
