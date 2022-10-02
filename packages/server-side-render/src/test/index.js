/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { rendererPath, removeBlockSupportAttributes } from '../utils';

describe( 'rendererPath', () => {
	test( 'should return an base path for empty input', () => {
		expect( rendererPath( 'core/test-block', null ) ).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit'
		);
		expect( rendererPath( 'core/test-block' ) ).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit'
		);
	} );

	test( 'should format basic url params', () => {
		expect(
			rendererPath( 'core/test-block', {
				stringArg: 'test',
				nullArg: null,
				emptyArg: '',
				numberArg: 123,
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BstringArg%5D=test&attributes%5BnullArg%5D=&attributes%5BemptyArg%5D=&attributes%5BnumberArg%5D=123'
		);
	} );

	test( 'should format object params', () => {
		expect(
			rendererPath( 'core/test-block', {
				objectArg: {
					stringProp: 'test',
					numberProp: 123,
				},
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BobjectArg%5D%5BstringProp%5D=test&attributes%5BobjectArg%5D%5BnumberProp%5D=123'
		);
	} );

	test( 'should format an array of objects', () => {
		expect(
			rendererPath( 'core/test-block', {
				children: [
					{
						name: 'bobby',
						age: 12,
						sex: 'M',
					},
					{
						name: 'sally',
						age: 8,
						sex: 'F',
					},
				],
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5Bchildren%5D%5B0%5D%5Bname%5D=bobby&attributes%5Bchildren%5D%5B0%5D%5Bage%5D=12&attributes%5Bchildren%5D%5B0%5D%5Bsex%5D=M&attributes%5Bchildren%5D%5B1%5D%5Bname%5D=sally&attributes%5Bchildren%5D%5B1%5D%5Bage%5D=8&attributes%5Bchildren%5D%5B1%5D%5Bsex%5D=F'
		);
	} );

	test( 'should include urlQueryArgs', () => {
		expect(
			rendererPath(
				'core/test-block',
				{
					stringArg: 'test',
				},
				{
					id: 1234,
				}
			)
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BstringArg%5D=test&id=1234'
		);
	} );
} );

describe( 'skipBlockSupportAttributes', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	const attributes = {
		className: 'class-name',
		customAttribute: 'custom-attribute',
		textColor: 'foreground',
		backgroundColor: 'foreground',
		gradient: 'vivid-cyan-blue-to-vivid-purple',
		fontSize: 'small',
		fontFamily: 'system-font',
		borderColor: 'foreground',
		style: {
			color: {
				text: '#000000',
				background: '#000000',
				gradients: '#000000',
			},
			typography: {
				fontSize: '10px',
				lineHeight: '1',
				fontWeight: '500',
				fontStyle: 'normal',
				textTransform: 'uppercase',
				textDecoration: 'line-through',
				letterSpacing: '10px',
			},
			spacing: {
				margin: {
					top: '10px',
					right: '10px',
					bottom: '10px',
					left: '10px',
				},
				padding: {
					top: '10px',
					right: '10px',
					bottom: '10px',
					left: '10px',
				},
				blockGap: '10px',
			},
			border: {
				radius: '10px',
				style: 'solid',
				top: {
					width: '10px',
					color: '#000000',
				},
				right: {
					width: '10px',
					color: '#000000',
				},
				bottom: {
					width: '10px',
					color: '#000000',
				},
				left: {
					width: '10px',
					color: '#000000',
				},
			},
		},
	};

	test( 'Should remove attributes and style properties', () => {
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'test block',
			supports: {
				color: {
					text: true,
					background: true,
					gradients: true,
					link: true,
				},
				typography: {
					fontSize: true,
					lineHeight: true,
					__experimentalFontFamily: true,
					__experimentalFontWeight: true,
					__experimentalFontStyle: true,
					__experimentalTextTransform: true,
					__experimentalTextDecoration: true,
					__experimentalLetterSpacing: true,
				},
				spacing: {
					margin: true,
					padding: true,
					blockGap: true,
				},
				__experimentalBorder: {
					radius: true,
					width: true,
					color: true,
					style: true,
				},
			},
		} );

		expect(
			removeBlockSupportAttributes( 'core/test-block', attributes )
		).toEqual( {
			customAttribute: 'custom-attribute',
		} );
	} );

	test( 'Should skip attributes and style properties which serialization is omitted', () => {
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'test block',
			supports: {
				color: {
					text: true,
					background: true,
					gradients: true,
					link: true,
					__experimentalSkipSerialization: [ 'text', 'gradients' ],
				},
				typography: {
					fontSize: true,
					lineHeight: true,
					__experimentalFontFamily: true,
					__experimentalFontWeight: true,
					__experimentalFontStyle: true,
					__experimentalTextTransform: true,
					__experimentalTextDecoration: true,
					__experimentalLetterSpacing: true,
					__experimentalSkipSerialization: [
						'fontSize',
						'__experimentalFontWeight',
					],
				},
				spacing: {
					margin: true,
					padding: true,
					blockGap: true,
					__experimentalSkipSerialization: true,
				},
				__experimentalBorder: {
					radius: true,
					width: true,
					color: true,
					style: true,
					__experimentalSkipSerialization: [ 'width', 'style' ],
				},
			},
		} );

		expect(
			removeBlockSupportAttributes( 'core/test-block', attributes )
		).toEqual( {
			customAttribute: 'custom-attribute',
			textColor: 'foreground',
			gradient: 'vivid-cyan-blue-to-vivid-purple',
			fontSize: 'small',
			style: {
				color: {
					text: '#000000',
				},
				typography: {
					fontSize: '10px',
					fontWeight: '500',
				},
				spacing: {
					margin: {
						top: '10px',
						right: '10px',
						bottom: '10px',
						left: '10px',
					},
					padding: {
						top: '10px',
						right: '10px',
						bottom: '10px',
						left: '10px',
					},
					blockGap: '10px',
				},
				border: {
					style: 'solid',
					top: {
						width: '10px',
					},
					right: {
						width: '10px',
					},
					bottom: {
						width: '10px',
					},
					left: {
						width: '10px',
					},
				},
			},
		} );
	} );
} );
