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
} from '../use-global-styles-output';
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
					selector: '.my-heading1, .my-heading2',
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
					selector: '.my-heading1, .my-heading2',
				},
				{
					styles: {
						typography: {
							fontSize: '42px',
						},
					},
					selector: '.my-heading1 h1, .my-heading2 h1',
				},
				{
					styles: {
						typography: {
							fontSize: '23px',
						},
					},
					selector: '.my-heading1 h2, .my-heading2 h2',
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
						palette: {
							custom: [
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
								{
									name: 'White to Black',
									slug: 'white2black',
									color: 'value',
								},
							],
						},
					},
					custom: {
						white2black: 'value',
						'font-primary': 'value',
						'line-height': {
							body: 1.7,
							heading: 1.3,
						},
					},
					blocks: {
						'core/heading': {
							typography: {
								fontSizes: {
									theme: [
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
				},
			};

			const blockSelectors = {
				'core/heading': {
					selector: 'h1,h2,h3,h4,h5,h6',
				},
			};

			expect( toCustomProperties( tree, blockSelectors ) ).toEqual(
				'body{--wp--preset--color--white: white;--wp--preset--color--black: black;--wp--preset--color--white-2-black: value;--wp--custom--white-2-black: value;--wp--custom--font-primary: value;--wp--custom--line-height--body: 1.7;--wp--custom--line-height--heading: 1.3;}h1,h2,h3,h4,h5,h6{--wp--preset--font-size--small: 12px;--wp--preset--font-size--medium: 23px;}'
			);
		} );
	} );

	describe( 'toStyles', () => {
		it( 'should return a ruleset', () => {
			const tree = {
				settings: {
					color: {
						palette: {
							default: [
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
					blocks: {
						'core/heading': {
							color: {
								palette: {
									default: [
										{
											name: 'Blue',
											slug: 'blue',
											color: 'blue',
										},
									],
								},
							},
						},
					},
				},
				styles: {
					spacing: {
						margin: '10px',
						padding: '10px',
					},
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
						'core/group': {
							spacing: {
								margin: {
									top: '10px',
									right: '20px',
									bottom: '30px',
									left: '40px',
								},
								padding: {
									top: '11px',
									right: '22px',
									bottom: '33px',
									left: '44px',
								},
							},
						},
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
				'core/group': {
					selector: '.wp-block-group',
				},
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
				'.wp-site-blocks > * { margin-top: 0; margin-bottom: 0; }.wp-site-blocks > * + * { margin-top: var( --wp--style--block-gap ); }body{background-color: red;margin: 10px;padding: 10px;}h1{font-size: 42px;}.wp-block-group{margin-top: 10px;margin-right: 20px;margin-bottom: 30px;margin-left: 40px;padding-top: 11px;padding-right: 22px;padding-bottom: 33px;padding-left: 44px;}h1,h2,h3,h4,h5,h6{color: orange;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: hotpink;}.has-white-color{color: var(--wp--preset--color--white) !important;}.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}.has-white-border-top-color{border-top-color: var(--wp--preset--color--white) !important;}.has-white-border-right-color{border-right-color: var(--wp--preset--color--white) !important;}.has-white-border-bottom-color{border-bottom-color: var(--wp--preset--color--white) !important;}.has-white-border-left-color{border-left-color: var(--wp--preset--color--white) !important;}.has-black-color{color: var(--wp--preset--color--black) !important;}.has-black-background-color{background-color: var(--wp--preset--color--black) !important;}.has-black-border-color{border-color: var(--wp--preset--color--black) !important;}.has-black-border-top-color{border-top-color: var(--wp--preset--color--black) !important;}.has-black-border-right-color{border-right-color: var(--wp--preset--color--black) !important;}.has-black-border-bottom-color{border-bottom-color: var(--wp--preset--color--black) !important;}.has-black-border-left-color{border-left-color: var(--wp--preset--color--black) !important;}h1.has-blue-color,h2.has-blue-color,h3.has-blue-color,h4.has-blue-color,h5.has-blue-color,h6.has-blue-color{color: var(--wp--preset--color--blue) !important;}h1.has-blue-background-color,h2.has-blue-background-color,h3.has-blue-background-color,h4.has-blue-background-color,h5.has-blue-background-color,h6.has-blue-background-color{background-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-color,h2.has-blue-border-color,h3.has-blue-border-color,h4.has-blue-border-color,h5.has-blue-border-color,h6.has-blue-border-color{border-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-top-color,h2.has-blue-border-top-color,h3.has-blue-border-top-color,h4.has-blue-border-top-color,h5.has-blue-border-top-color,h6.has-blue-border-top-color{border-top-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-right-color,h2.has-blue-border-right-color,h3.has-blue-border-right-color,h4.has-blue-border-right-color,h5.has-blue-border-right-color,h6.has-blue-border-right-color{border-right-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-bottom-color,h2.has-blue-border-bottom-color,h3.has-blue-border-bottom-color,h4.has-blue-border-bottom-color,h5.has-blue-border-bottom-color,h6.has-blue-border-bottom-color{border-bottom-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-left-color,h2.has-blue-border-left-color,h3.has-blue-border-left-color,h4.has-blue-border-left-color,h5.has-blue-border-left-color,h6.has-blue-border-left-color{border-left-color: var(--wp--preset--color--blue) !important;}'
			);
		} );
	} );
} );
