import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
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

function addUseSettingFilter(
	callback: ( result: unknown, path: string ) => unknown
) {
	addFilter(
		'blockEditor.useSetting.before',
		'test/useSetting.before',
		callback
	);
}

describe( 'useBlockProps', () => {
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
		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'should return preset classname', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		addUseSettingFilter( ( result, path ) => {
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

		const { result } = renderHook( () =>
			_fontSize.useBlockProps( {
				name: blockSettings.name,
				fontSize: 'larger',
			} )
		);
		// The block has a font size, so it gets a style.
		const { style, className } = result.current!;
		expect( className ).toBe( 'has-larger-font-size' );
		expect( style!.fontSize ).toBe( '32px' );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'should return custom font size', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		addUseSettingFilter( ( result, path ) => {
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

		const { result } = renderHook( () =>
			_fontSize.useBlockProps( {
				name: blockSettings.name,
				style: {
					typography: {
						fontSize: '28px',
					},
				},
			} )
		);
		// The block has a font size, so it gets a style.
		const { style } = result.current!;
		expect( style!.fontSize ).toBe( '28px' );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'should convert custom font sizes to fluid', () => {
		// The test block needs no attributes or edit.
		registerBlockType(
			blockSettings.name,
			blockSettings as unknown as BlockConfiguration
		);
		addUseSettingFilter( ( result, path ) => {
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

		const { result } = renderHook( () =>
			_fontSize.useBlockProps( {
				name: blockSettings.name,
				style: {
					typography: {
						fontSize: '28px',
					},
				},
			} )
		);
		// The block has a font size, so it gets a style.
		const { style } = result.current!;
		expect( style!.fontSize ).toBe(
			'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)'
		);
	} );
} );
