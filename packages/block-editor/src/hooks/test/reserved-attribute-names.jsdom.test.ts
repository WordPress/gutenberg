/**
 * Tests for the developer warning emitted when a block uses a reserved
 * attribute name (`style`, `layout`) for one of its own attributes.
 *
 * See https://github.com/WordPress/gutenberg/issues/48112
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getBlockType,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import '../style';
import '../layout';

const TEST_BLOCK_NAMES = [
	'test/reserved-style-attribute',
	'test/reserved-layout-attribute',
	'test/no-style-support',
	'test/no-reserved-attribute',
];

describe( 'reserved attribute name warnings', () => {
	beforeEach( () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
		TEST_BLOCK_NAMES.forEach( ( name ) => {
			if ( getBlockType( name ) ) {
				unregisterBlockType( name );
			}
		} );
	} );

	it( 'warns when a block defines its own "style" attribute while style support is enabled', () => {
		registerBlockType( 'test/reserved-style-attribute', {
			title: 'Reserved style attribute',
			category: 'text',
			apiVersion: 3,
			attributes: {
				style: {
					type: 'string',
				},
			},
			supports: {
				color: true,
			},
			edit: () => null,
			save: () => null,
		} );

		expect( console ).toHaveWarnedWith(
			'The block "test/reserved-style-attribute" defines a "style" attribute, but "style" is reserved for block support styles. Rename the attribute to avoid unexpected behavior.'
		);
	} );

	it( 'does not warn when a block has its own "style" attribute but style support and custom CSS are both disabled', () => {
		registerBlockType( 'test/no-style-support', {
			title: 'No style support',
			category: 'text',
			apiVersion: 3,
			attributes: {
				style: {
					type: 'string',
				},
			},
			supports: {
				customCSS: false,
			},
			edit: () => null,
			save: () => null,
		} );

		expect( console ).not.toHaveWarned();
	} );

	it( 'warns when a block defines its own "layout" attribute while layout support is enabled', () => {
		registerBlockType( 'test/reserved-layout-attribute', {
			title: 'Reserved layout attribute',
			category: 'text',
			apiVersion: 3,
			attributes: {
				layout: {
					type: 'string',
				},
			},
			supports: {
				layout: true,
			},
			edit: () => null,
			save: () => null,
		} );

		expect( console ).toHaveWarnedWith(
			'The block "test/reserved-layout-attribute" defines a "layout" attribute, but "layout" is reserved for block layout support. Rename the attribute to avoid unexpected behavior.'
		);
	} );

	it( 'does not warn for blocks without reserved attribute names', () => {
		registerBlockType( 'test/no-reserved-attribute', {
			title: 'No reserved attribute',
			category: 'text',
			apiVersion: 3,
			attributes: {
				content: {
					type: 'string',
				},
			},
			supports: {
				color: true,
				layout: true,
			},
			edit: () => null,
			save: () => null,
		} );

		expect( console ).not.toHaveWarned();
	} );
} );
