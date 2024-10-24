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
import type { BlockExample, ColorOrigin, MultiOriginPalettes } from './types';
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
		const palette = colors[ group.type ].find(
			( origin: ColorOrigin ) => origin.slug === group.origin
		);

		if ( palette?.[ group.type ] ) {
			const example: BlockExample = {
				name: group.slug,
				title: group.title,
				category: 'colors',
			};
			if ( group.type === 'duotones' ) {
				example.content = (
					<DuotoneExamples duotones={ palette[ group.type ] } />
				);
				examples.push( example );
			} else {
				example.content = (
					<ColorExamples
						colors={ palette[ group.type ] }
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
