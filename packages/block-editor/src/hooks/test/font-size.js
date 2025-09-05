/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import _fontSize from '../font-size';

const noop = () => {};
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const fontSizes = [
	{
		name: 'A larger font',
		size: '32px',
		slug: 'larger',
	},
];

function addUseSettingFilter( callback ) {
	addFilter(
		'blockEditor.useSetting.before',
		'test/useSetting.before',
		callback
	);
}

describe( 'useBlockProps', () => {
	const blockSettings = {
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
		registerBlockType( blockSettings.name, blockSettings );
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
		const { style, className } = result.current;
		expect( className ).toBe( 'has-larger-font-size' );
		expect( style.fontSize ).toBe( '32px' );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'should return custom font size', () => {
		registerBlockType( blockSettings.name, blockSettings );
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
		const { style } = result.current;
		expect( style.fontSize ).toBe( '28px' );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'should convert custom font sizes to fluid', () => {
		registerBlockType( blockSettings.name, blockSettings );
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
		const { style } = result.current;
		expect( style.fontSize ).toBe(
			'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)'
		);
	} );
} );
