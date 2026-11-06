import { afterEach, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import _fontSize from '../font-size';

const noop = () => {};
const EMPTY_ARRAY: never[] = [];
const EMPTY_OBJECT = {};
const fontSizes = [
	{
		name: 'A larger font',
		size: '32px',
		slug: 'larger',
	},
];

// The settings font sizes read, as the callback resolves them.
function getSettings( callback: ( result: unknown, path: string ) => unknown ) {
	return Object.fromEntries(
		_fontSize.settings.map( ( path ) => [
			path,
			callback( undefined, path ),
		] )
	);
}

describe( 'getBlockProps', () => {
	const blockSettings = {
		apiVersion: 3,
		save: () => noop,
		category: 'text',
		title: 'font size title',
		name: 'test/font-size',
		supports: {
			typography: {
				fontSize: true,
			},
		},
	};

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return preset classname', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		const settings = getSettings( ( result, path ) => {
			if ( 'typography.fontSizes' === path ) {
				return fontSizes;
			}

			if ( 'typography.fluid' === path ) {
				return false;
			}

			if ( 'layout' === path ) {
				return EMPTY_OBJECT;
			}

			return result;
		} );

		const props = _fontSize.getBlockProps(
			{
				name: blockSettings.name,
				fontSize: 'larger',
			},
			{ settings }
		);
		// The block has a font size, so it gets a style.
		const { style, className } = props!;
		expect( className ).toBe( 'has-larger-font-size' );
		expect( style!.fontSize ).toBe( '32px' );
	} );

	it( 'should return custom font size', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		const settings = getSettings( ( result, path ) => {
			if ( 'typography.fontSizes' === path ) {
				return EMPTY_ARRAY;
			}

			if ( 'typography.fluid' === path ) {
				return false;
			}

			if ( 'layout' === path ) {
				return EMPTY_OBJECT;
			}

			return result;
		} );

		const props = _fontSize.getBlockProps(
			{
				name: blockSettings.name,
				style: {
					typography: {
						fontSize: '28px',
					},
				},
			},
			{ settings }
		);
		// The block has a font size, so it gets a style.
		const { style } = props!;
		expect( style!.fontSize ).toBe( '28px' );
	} );

	it( 'should convert custom font sizes to fluid', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		const settings = getSettings( ( result, path ) => {
			if ( 'typography.fontSizes' === path ) {
				return EMPTY_ARRAY;
			}

			if ( 'typography.fluid' === path ) {
				return true;
			}

			if ( 'layout' === path ) {
				return EMPTY_OBJECT;
			}

			return result;
		} );

		const props = _fontSize.getBlockProps(
			{
				name: blockSettings.name,
				style: {
					typography: {
						fontSize: '28px',
					},
				},
			},
			{ settings }
		);
		// The block has a font size, so it gets a style.
		const { style } = props!;
		expect( style!.fontSize ).toBe(
			'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)'
		);
	} );
} );
