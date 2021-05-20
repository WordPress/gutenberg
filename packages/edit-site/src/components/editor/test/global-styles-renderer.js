/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_ELEMENTS as ELEMENTS } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getNodesWithSettings,
	getNodesWithStyles,
	toCustomProperties,
	toStyles,
} from '../global-styles-renderer';
import { ROOT_BLOCK_SELECTOR } from '../utils';

describe( 'global styles renderer', () => {
	describe( 'getNodesWithStyles', () => {
		it( 'should return the nodes with styles', () => {
			const tree = {
				styles: {
					color: {
						background: 'red',
						text: 'red',
					},
					blocks: {
						'core/heading': {
							color: {
								background: 'blue',
								text: 'blue',
							},
							elements: {
								h1: {
									typography: {
										fontSize: '42px',
									},
								},
								h2: {
									typography: {
										fontSize: '23px',
									},
								},
							},
						},
					},
					elements: {
						link: {
							color: {
								background: 'yellow',
								text: 'yellow',
							},
						},
					},
				},
			};
			const blockSelectors = {
				'core/heading': {
					selector: 'h1,h2,h3,h4,h5,h6',
					elements: {
						link: 'h1 a,h2 a,h3 a,h4 a,h5 a,h6 a',
						h1: 'h1',
						h2: 'h2',
						h3: 'h3',
						h4: 'h4',
						h5: 'h5',
						h6: 'h6',
					},
				},
			};
			expect( getNodesWithStyles( tree, blockSelectors ) ).toEqual( [
				{
					styles: {
						color: {
							background: 'red',
							text: 'red',
						},
					},
					selector: ROOT_BLOCK_SELECTOR,
				},
				{
					styles: {
						color: {
							background: 'yellow',
							text: 'yellow',
						},
					},
					selector: ELEMENTS.link,
				},
				{
					styles: {
						color: {
							background: 'blue',
							text: 'blue',
						},
					},
					selector: 'h1,h2,h3,h4,h5,h6',
				},
				{
					styles: {
						typography: {
							fontSize: '42px',
						},
					},
					selector: 'h1',
				},
				{
					styles: {
						typography: {
							fontSize: '23px',
						},
					},
					selector: 'h2',
				},
			] );
		} );
	} );
	describe( 'getNodesWithSettings', () => {
		it( 'should return nodes with settings', () => {
			const tree = {
				styles: {
					color: {
						background: 'red',
						text: 'red',
					},
				},
				settings: {
					color: {
						palette: [
							{ name: 'White', slug: 'white', color: 'white' },
							{ name: 'Black', slug: 'black', color: 'black' },
						],
					},
					blocks: {
						'core/paragraph': {
							typography: {
								fontSizes: [
									{
										name: 'small',
										slug: 'small',
										size: '12px',
									},
									{
										name: 'medium',
										slug: 'medium',
										size: '23px',
									},
								],
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/paragraph': {
					selector: 'p',
					elements: {
						link: 'p a',
						h1: 'p h1',
						h2: 'p h2',
						h3: 'p h3',
						h4: 'p h4',
						h5: 'p h5',
						h6: 'p h6',
					},
				},
			};

			expect( getNodesWithSettings( tree, blockSelectors ) ).toEqual( [
				{
					presets: {
						color: {
							palette: [
								{
									name: 'White',
									slug: 'white',
									color: 'white',
								},
								{
									name: 'Black',
									slug: 'black',
									color: 'black',
								},
							],
						},
					},
					selector: ROOT_BLOCK_SELECTOR,
				},
				{
					presets: {
						typography: {
							fontSizes: [
								{
									name: 'small',
									slug: 'small',
									size: '12px',
								},
								{
									name: 'medium',
									slug: 'medium',
									size: '23px',
								},
							],
						},
					},
					selector: 'p',
				},
			] );
		} );
	} );

	describe( 'toCustomProperties', () => {
		it( 'should return a ruleset', () => {
			const tree = {
				settings: {
					color: {
						palette: [
							{ name: 'White', slug: 'white', color: 'white' },
							{ name: 'Black', slug: 'black', color: 'black' },
						],
					},
					custom: {
						'font-primary': 'value',
						'line-height': {
							body: 1.7,
							heading: 1.3,
						},
					},
					blocks: {
						'core/heading': {
							typography: {
								fontSizes: [
									{
										name: 'small',
										slug: 'small',
										size: '12px',
									},
									{
										name: 'medium',
										slug: 'medium',
										size: '23px',
									},
								],
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/heading': {
					selector: 'h1,h2,h3,h4,h5,h6',
				},
			};

			expect( toCustomProperties( tree, blockSelectors ) ).toEqual(
				'body{--wp--preset--color--white: white;--wp--preset--color--black: black;--wp--custom--font-primary: value;--wp--custom--line-height--body: 1.7;--wp--custom--line-height--heading: 1.3;}h1,h2,h3,h4,h5,h6{--wp--preset--font-size--small: 12px;--wp--preset--font-size--medium: 23px;}'
			);
		} );
	} );

	describe( 'toStyles', () => {
		it( 'should return a ruleset', () => {
			const tree = {
				settings: {
					color: {
						palette: [
							{ name: 'White', slug: 'white', color: 'white' },
							{ name: 'Black', slug: 'black', color: 'black' },
						],
					},
				},
				styles: {
					color: {
						background: 'red',
					},
					elements: {
						h1: {
							typography: {
								fontSize: '42px',
							},
						},
					},
					blocks: {
						'core/heading': {
							color: {
								text: 'orange',
							},
							elements: {
								link: {
									color: {
										text: 'hotpink',
									},
								},
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/heading': {
					selector: 'h1,h2,h3,h4,h5,h6',
					elements: {
						link:
							'h1 ' +
							ELEMENTS.link +
							',h2 ' +
							ELEMENTS.link +
							',h3 ' +
							ELEMENTS.link +
							',h4 ' +
							ELEMENTS.link +
							',h5 ' +
							ELEMENTS.link +
							',h6 ' +
							ELEMENTS.link,
					},
				},
			};

			expect( toStyles( tree, blockSelectors ) ).toEqual(
				'body{background-color: red;}h1{font-size: 42px;}h1,h2,h3,h4,h5,h6{color: orange;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: hotpink;}.has-white-color{color: white !important;}.has-white-background-color{background-color: white !important;}.has-white-border-color{border-color: white !important;}.has-black-color{color: black !important;}.has-black-background-color{background-color: black !important;}.has-black-border-color{border-color: black !important;}'
			);
		} );
	} );
} );
