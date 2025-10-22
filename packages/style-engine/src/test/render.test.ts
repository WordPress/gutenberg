/**
 * Internal dependencies
 */
import {
	getNodesWithStyles,
	getNodesWithSettings,
	generateCustomProperties,
	transformToStyles,
	getBlockSelectors,
} from '../core/render';
import type { GlobalStylesConfig } from '../types';
import {
	ROOT_BLOCK_SELECTOR,
	ROOT_CSS_PROPERTIES_SELECTOR,
} from '../utils/common';

// Mock WordPress data store
jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

// Mock WordPress blocks store
jest.mock( '@wordpress/blocks', () => ( {
	__EXPERIMENTAL_STYLE_PROPERTY: {
		filter: {
			value: [ 'filter', 'duotone' ],
			support: [ 'filter', 'duotone' ],
		},
	},
	__EXPERIMENTAL_ELEMENTS: {
		link: 'a:where(:not(.wp-element-button))',
		h1: 'h1',
		h2: 'h2',
		h3: 'h3',
		h4: 'h4',
		h5: 'h5',
		h6: 'h6',
		button: '.wp-element-button',
		caption: '.wp-element-caption',
	},
	getBlockSupport: jest.fn(),
	getBlockTypes: jest.fn(),
	store: 'core/blocks',
} ) );

// Mock WordPress elements (minimal, no mocking of complex APIs)
const ELEMENTS = {
	link: 'a:where(:not(.wp-element-button))',
	h1: 'h1',
	h2: 'h2',
	h3: 'h3',
	h4: 'h4',
	h5: 'h5',
	h6: 'h6',
	button: '.wp-element-button',
	caption: '.wp-element-caption',
};

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
								link: {
									':hover': {
										color: {
											background: 'green',
											text: 'yellow',
										},
									},
									':focus': {
										color: {
											background: 'green',
											text: 'yellow',
										},
									},
								},
							},
						},
						'core/image': {
							border: {
								radius: '9999px',
							},
						},
					},
					elements: {
						link: {
							color: {
								background: 'yellow',
								text: 'yellow',
							},
							':hover': {
								color: {
									background: 'hotpink',
									text: 'black',
								},
							},
							':focus': {
								color: {
									background: 'hotpink',
									text: 'black',
								},
							},
						},
					},
				},
			};
			const blockSelectors = {
				'core/heading': {
					selector: '.my-heading1, .my-heading2',
				},
				'core/image': {
					selector: '.my-image',
					featureSelectors: '.my-image img, .my-image .crop-area',
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
					skipSelectorWrapper: true,
				},
				{
					styles: {
						color: {
							background: 'yellow',
							text: 'yellow',
						},
						':hover': {
							color: {
								background: 'hotpink',
								text: 'black',
							},
						},
						':focus': {
							color: {
								background: 'hotpink',
								text: 'black',
							},
						},
					},
					selector: ELEMENTS.link,
					skipSelectorWrapper: true,
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
				{
					styles: {
						':hover': {
							color: {
								background: 'green',
								text: 'yellow',
							},
						},
						':focus': {
							color: {
								background: 'green',
								text: 'yellow',
							},
						},
					},
					selector:
						'.my-heading1 a:where(:not(.wp-element-button)), .my-heading2 a:where(:not(.wp-element-button))',
				},
				{
					styles: {
						border: {
							radius: '9999px',
						},
					},
					selector: '.my-image',
					featureSelectors: '.my-image img, .my-image .crop-area',
				},
			] );
		} );
	} );

	describe( 'getNodesWithSettings', () => {
		it( 'should return nodes with settings', () => {
			const tree: GlobalStylesConfig = {
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
					selector: ROOT_CSS_PROPERTIES_SELECTOR,
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

	describe( 'generateCustomProperties', () => {
		it( 'should return a ruleset', () => {
			const tree: GlobalStylesConfig = {
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

			expect( generateCustomProperties( tree, blockSelectors ) ).toEqual(
				':root{--wp--preset--color--white: white;--wp--preset--color--black: black;--wp--preset--color--white-2-black: value;--wp--custom--white-2-black: value;--wp--custom--font-primary: value;--wp--custom--line-height--body: 1.7;--wp--custom--line-height--heading: 1.3;}h1,h2,h3,h4,h5,h6{--wp--preset--font-size--small: 12px;--wp--preset--font-size--medium: 23px;}'
			);
		} );
	} );

	describe( 'transformToStyles', () => {
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
						link: {
							color: {
								text: 'blue',
							},
							':hover': {
								color: {
									text: 'orange',
								},
							},
							':focus': {
								color: {
									text: 'orange',
								},
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
									':hover': {
										color: {
											text: 'red',
										},
									},
									':focus': {
										color: {
											text: 'red',
										},
									},
								},
							},
						},
						'core/image': {
							color: {
								text: 'red',
							},
							border: {
								radius: '9999px',
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
				},
				'core/image': {
					selector: '.wp-block-image',
					featureSelectors: {
						border: '.wp-block-image img, .wp-block-image .wp-crop-area',
					},
				},
			};

			expect( transformToStyles( tree, blockSelectors ) ).toEqual(
				':where(body) {margin: 0;}.is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }.is-layout-flex { flex-wrap: wrap; align-items: center; }.is-layout-flex > :is(*, div) { margin: 0; }body .is-layout-grid { display:grid; }.is-layout-grid > :is(*, div) { margin: 0; }body{background-color: red;margin: 10px;padding: 10px;}a:where(:not(.wp-element-button)){color: blue;}:root :where(a:where(:not(.wp-element-button)):hover){color: orange;}:root :where(a:where(:not(.wp-element-button)):focus){color: orange;}h1{font-size: 42px;}:root :where(.wp-block-group){margin-top: 10px;margin-right: 20px;margin-bottom: 30px;margin-left: 40px;padding-top: 11px;padding-right: 22px;padding-bottom: 33px;padding-left: 44px;}:root :where(h1,h2,h3,h4,h5,h6){color: orange;}:root :where(h1 a:where(:not(.wp-element-button)),h2 a:where(:not(.wp-element-button)),h3 a:where(:not(.wp-element-button)),h4 a:where(:not(.wp-element-button)),h5 a:where(:not(.wp-element-button)),h6 a:where(:not(.wp-element-button))){color: hotpink;}:root :where(h1 a:where(:not(.wp-element-button)):hover,h2 a:where(:not(.wp-element-button)):hover,h3 a:where(:not(.wp-element-button)):hover,h4 a:where(:not(.wp-element-button)):hover,h5 a:where(:not(.wp-element-button)):hover,h6 a:where(:not(.wp-element-button)):hover){color: red;}:root :where(h1 a:where(:not(.wp-element-button)):focus,h2 a:where(:not(.wp-element-button)):focus,h3 a:where(:not(.wp-element-button)):focus,h4 a:where(:not(.wp-element-button)):focus,h5 a:where(:not(.wp-element-button)):focus,h6 a:where(:not(.wp-element-button)):focus){color: red;}:root :where(.wp-block-image img, .wp-block-image .wp-crop-area){border-radius: 9999px;}:root :where(.wp-block-image){color: red;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.has-white-color{color: var(--wp--preset--color--white) !important;}.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}.has-black-color{color: var(--wp--preset--color--black) !important;}.has-black-background-color{background-color: var(--wp--preset--color--black) !important;}.has-black-border-color{border-color: var(--wp--preset--color--black) !important;}h1.has-blue-color,h2.has-blue-color,h3.has-blue-color,h4.has-blue-color,h5.has-blue-color,h6.has-blue-color{color: var(--wp--preset--color--blue) !important;}h1.has-blue-background-color,h2.has-blue-background-color,h3.has-blue-background-color,h4.has-blue-background-color,h5.has-blue-background-color,h6.has-blue-background-color{background-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-color,h2.has-blue-border-color,h3.has-blue-border-color,h4.has-blue-border-color,h5.has-blue-border-color,h6.has-blue-border-color{border-color: var(--wp--preset--color--blue) !important;}'
			);
		} );

		it( 'should handle feature selectors', () => {
			const tree = {
				styles: {
					blocks: {
						'core/image': {
							color: {
								text: 'red',
							},
							spacing: {
								padding: {
									top: '1px',
								},
							},
							border: {
								color: 'red',
								radius: '9999px',
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/image': {
					selector: '.wp-image',
					featureSelectors: {
						spacing: '.wp-image-spacing',
						border: {
							root: '.wp-image-border',
							color: '.wp-image-border-color',
						},
					},
				},
			};

			expect(
				transformToStyles( Object.freeze( tree ), blockSelectors )
			).toEqual(
				':where(body) {margin: 0;}.is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }.is-layout-flex { flex-wrap: wrap; align-items: center; }.is-layout-flex > :is(*, div) { margin: 0; }body .is-layout-grid { display:grid; }.is-layout-grid > :is(*, div) { margin: 0; }:root :where(.wp-image-spacing){padding-top: 1px;}:root :where(.wp-image-border-color){border-color: red;}:root :where(.wp-image-border){border-radius: 9999px;}:root :where(.wp-image){color: red;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
			);
		} );

		it( 'should handle block variations', () => {
			const tree: GlobalStylesConfig = {
				styles: {
					blocks: {
						'core/image': {
							variations: {
								foo: {
									color: {
										text: 'blue',
									},
									spacing: {
										padding: {
											top: '2px',
										},
									},
									border: {
										color: 'blue',
									},
								},
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/image': {
					selector: '.wp-image',
					featureSelectors: {
						spacing: '.wp-image-spacing',
						border: {
							root: '.wp-image-border',
							color: '.wp-image-border-color',
						},
					},
					styleVariationSelectors: {
						foo: '.is-style-foo.wp-image',
					},
				},
			};

			const hasBlockGapSupport = false;
			const hasFallbackGapSupport = true;
			const disableLayoutStyles = true;
			const disableRootPadding = true;
			const styleOptions: Record< string, boolean > = {
				blockGap: false,
				blockStyles: true,
				layoutStyles: false,
				marginReset: false,
				presets: false,
				rootPadding: false,
			};

			// Confirm no variation styles by default.
			const withoutVariations = transformToStyles(
				Object.freeze( tree ),
				blockSelectors,
				hasBlockGapSupport,
				hasFallbackGapSupport,
				disableLayoutStyles,
				disableRootPadding,
				styleOptions
			);
			expect( withoutVariations ).toEqual( '' );

			// Includes variation styles when requested.
			styleOptions.variationStyles = true;
			const withVariations = transformToStyles(
				Object.freeze( tree ),
				blockSelectors,
				hasBlockGapSupport,
				hasFallbackGapSupport,
				disableLayoutStyles,
				disableRootPadding,
				styleOptions
			);
			expect( withVariations ).toEqual(
				':root :where(.is-style-foo.wp-image.wp-image-spacing){padding-top: 2px;}:root :where(.is-style-foo.wp-image.wp-image-border-color){border-color: blue;}:root :where(.is-style-foo.wp-image){color: blue;}'
			);
		} );

		it( 'should handle duotone filter', () => {
			const tree = {
				styles: {
					blocks: {
						'core/image': {
							filter: {
								duotone: 'blur(5px)',
							},
						},
					},
				},
			};

			const blockSelectors = {
				'core/image': {
					selector: '.wp-image',
					duotoneSelector: '.wp-image img',
				},
			};

			expect(
				transformToStyles( Object.freeze( tree ), blockSelectors )
			).toEqual(
				':where(body) {margin: 0;}.is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }.is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }.is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }.is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }.is-layout-flex { flex-wrap: wrap; align-items: center; }.is-layout-flex > :is(*, div) { margin: 0; }body .is-layout-grid { display:grid; }.is-layout-grid > :is(*, div) { margin: 0; }.wp-image img{filter: blur(5px);}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
			);
		} );

		it( 'should output content and wide size variables if values are specified', () => {
			const tree = {
				settings: {
					layout: {
						contentSize: '840px',
						wideSize: '1100px',
					},
				},
			};
			expect(
				transformToStyles( Object.freeze( tree ), 'body' )
			).toEqual(
				':root { --wp--style--global--content-size: 840px; --wp--style--global--wide-size: 1100px;}:where(body) {margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
			);
		} );
	} );

	describe( 'getBlockSelectors', () => {
		beforeEach( () => {
			// Reset mocks before each test
			jest.clearAllMocks();
		} );

		it( 'should return block selectors data', () => {
			// Mock the select function to return getBlockStyles
			const mockSelect = require( '@wordpress/data' ).select as jest.Mock;
			mockSelect.mockReturnValue( {
				getBlockStyles: () => [ { name: 'foo', label: 'foo' } ],
			} );

			const imageSelectors = {
				root: '.my-image',
				border: '.my-image img, .my-image .crop-area',
				filter: { duotone: 'img' },
			};
			const imageBlock = {
				name: 'core/image',
				selectors: imageSelectors,
				title: 'My Image',
				category: 'media',
			};
			const blockTypes = [ imageBlock ];
			expect( getBlockSelectors( blockTypes ) ).toEqual( {
				'core/image': {
					name: imageBlock.name,
					selector: imageSelectors.root,
					duotoneSelector: imageSelectors.filter.duotone,
					fallbackGapValue: undefined,
					featureSelectors: {
						root: '.my-image',
						border: '.my-image img, .my-image .crop-area',
						filter: { duotone: 'img' },
					},
					styleVariationSelectors: {
						foo: '.my-image.is-style-foo',
					},
					hasLayoutSupport: false,
				},
			} );
		} );

		it( 'should return block selectors data with old experimental selectors', () => {
			// Mock the select function to return getBlockStyles with empty array
			const mockSelect = require( '@wordpress/data' ).select as jest.Mock;
			mockSelect.mockReturnValue( {
				getBlockStyles: () => [],
			} );

			// Mock getBlockSupport to handle experimental duotone support
			const mockGetBlockSupport = require( '@wordpress/blocks' )
				.getBlockSupport as jest.Mock;
			mockGetBlockSupport.mockImplementation(
				( blockType, path, defaultValue ) => {
					if ( path === 'color.__experimentalDuotone' ) {
						return 'img';
					}
					return defaultValue;
				}
			);

			const imageSupports = {
				__experimentalBorder: {
					radius: true,
					__experimentalSelector: 'img, .crop-area',
				},
				color: {
					__experimentalDuotone: 'img',
				},
				__experimentalSelector: '.my-image',
			};
			const imageBlock = {
				name: 'core/image',
				supports: imageSupports,
				title: 'My Image',
				category: 'media',
			};
			const blockTypes = [ imageBlock ];

			expect( getBlockSelectors( blockTypes ) ).toEqual( {
				'core/image': {
					name: imageBlock.name,
					selector: imageSupports.__experimentalSelector,
					duotoneSelector: '.my-image img',
					fallbackGapValue: undefined,
					featureSelectors: {
						root: '.my-image',
						border: '.my-image img, .my-image .crop-area',
					},
					hasLayoutSupport: false,
				},
			} );
		} );
	} );
} );
