/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_ELEMENTS as ELEMENTS } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getLayoutStyles,
	getNodesWithSettings,
	getNodesWithStyles,
	getBlockSelectors,
	toCustomProperties,
	toStyles,
	getStylesDeclarations,
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
					selector: '.my-heading1 a, .my-heading2 a',
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

			expect( toStyles( tree, blockSelectors ) ).toEqual(
				'body {margin: 0;}body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }body .is-layout-grid { display:grid; }body .is-layout-grid > * { margin: 0; }' +
					'body{background-color: red;margin: 10px;padding: 10px;}a{color: blue;}a:hover{color: orange;}a:focus{color: orange;}h1{font-size: 42px;}.wp-block-group{margin-top: 10px;margin-right: 20px;margin-bottom: 30px;margin-left: 40px;padding-top: 11px;padding-right: 22px;padding-bottom: 33px;padding-left: 44px;}h1,h2,h3,h4,h5,h6{color: orange;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: hotpink;}h1 a:hover,h2 a:hover,h3 a:hover,h4 a:hover,h5 a:hover,h6 a:hover{color: red;}h1 a:focus,h2 a:focus,h3 a:focus,h4 a:focus,h5 a:focus,h6 a:focus{color: red;}' +
					'.wp-block-image img, .wp-block-image .wp-crop-area{border-radius: 9999px;}.wp-block-image{color: red;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }' +
					'.has-white-color{color: var(--wp--preset--color--white) !important;}.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}.has-black-color{color: var(--wp--preset--color--black) !important;}.has-black-background-color{background-color: var(--wp--preset--color--black) !important;}.has-black-border-color{border-color: var(--wp--preset--color--black) !important;}h1.has-blue-color,h2.has-blue-color,h3.has-blue-color,h4.has-blue-color,h5.has-blue-color,h6.has-blue-color{color: var(--wp--preset--color--blue) !important;}h1.has-blue-background-color,h2.has-blue-background-color,h3.has-blue-background-color,h4.has-blue-background-color,h5.has-blue-background-color,h6.has-blue-background-color{background-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-color,h2.has-blue-border-color,h3.has-blue-border-color,h4.has-blue-border-color,h5.has-blue-border-color,h6.has-blue-border-color{border-color: var(--wp--preset--color--blue) !important;}'
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

			expect( toStyles( Object.freeze( tree ), blockSelectors ) ).toEqual(
				'body {margin: 0;}body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }body .is-layout-grid { display:grid; }body .is-layout-grid > * { margin: 0; }' +
					'.wp-image-spacing{padding-top: 1px;}.wp-image-border-color{border-color: red;}.wp-image-border{border-radius: 9999px;}.wp-image{color: red;}' +
					'.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
			);
		} );

		it( 'should handle block variations', () => {
			const tree = {
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

			expect( toStyles( Object.freeze( tree ), blockSelectors ) ).toEqual(
				'body {margin: 0;}body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }body .is-layout-grid { display:grid; }body .is-layout-grid > * { margin: 0; }' +
					'.is-style-foo.wp-image.wp-image-spacing{padding-top: 2px;}.is-style-foo.wp-image.wp-image-border-color{border-color: blue;}.is-style-foo.wp-image{color: blue;}' +
					'.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
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

			expect( toStyles( Object.freeze( tree ), blockSelectors ) ).toEqual(
				'body {margin: 0;}body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-constrained > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-constrained > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }body .is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }body .is-layout-grid { display:grid; }body .is-layout-grid > * { margin: 0; }' +
					'.wp-image img{filter: blur(5px);}' +
					'.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
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
			expect( toStyles( Object.freeze( tree ), 'body' ) ).toEqual(
				'body {margin: 0; --wp--style--global--content-size: 840px; --wp--style--global--wide-size: 1100px;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }'
			);
		} );
	} );

	describe( 'getLayoutStyles', () => {
		const layoutDefinitionsTree = {
			settings: {
				layout: {
					definitions: {
						default: {
							name: 'default',
							slug: 'flow',
							className: 'is-layout-flow',
							baseStyles: [
								{
									selector: ' > .alignleft',
									rules: {
										float: 'left',
										'margin-inline-start': '0',
										'margin-inline-end': '2em',
									},
								},
								{
									selector: ' > .alignright',
									rules: {
										float: 'right',
										'margin-inline-start': '2em',
										'margin-inline-end': '0',
									},
								},
								{
									selector: ' > .aligncenter',
									rules: {
										'margin-left': 'auto !important',
										'margin-right': 'auto !important',
									},
								},
							],
							spacingStyles: [
								{
									selector: ' > *',
									rules: {
										'margin-block-start': '0',
										'margin-block-end': '0',
									},
								},
								{
									selector: ' > * + *',
									rules: {
										'margin-block-start': null,
										'margin-block-end': '0',
									},
								},
							],
						},
						flex: {
							name: 'flex',
							slug: 'flex',
							className: 'is-layout-flex',
							displayMode: 'flex',
							baseStyles: [
								{
									selector: '',
									rules: {
										'flex-wrap': 'wrap',
										'align-items': 'center',
									},
								},
								{
									selector: ' > *',
									rules: {
										margin: '0',
									},
								},
							],
							spacingStyles: [
								{
									selector: '',
									rules: {
										gap: null,
									},
								},
							],
						},
					},
				},
			},
		};

		it( 'should return fallback gap flex layout style, and all base styles, if block styles are enabled and blockGap is disabled', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				layoutDefinitions:
					layoutDefinitionsTree.settings.layout.definitions,
				style,
				selector: 'body',
				hasBlockGapSupport: false,
				hasFallbackGapSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				':where(.is-layout-flex) { gap: 0.5em; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return fallback gap layout styles, and base styles, if blockGap is enabled, but there is no blockGap value', () => {
			const style = {};

			const layoutStyles = getLayoutStyles( {
				layoutDefinitions:
					layoutDefinitionsTree.settings.layout.definitions,
				style,
				selector: 'body',
				hasBlockGapSupport: true,
				hasFallbackGapSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				':where(body .is-layout-flow) > * { margin-block-start: 0; margin-block-end: 0; }:where(body .is-layout-flow) > * + * { margin-block-start: 0.5em; margin-block-end: 0; }:where(body .is-layout-flex) { gap: 0.5em; }body { --wp--style--block-gap: 0.5em; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return real gap layout style if blockGap is enabled, and base styles', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				layoutDefinitions:
					layoutDefinitionsTree.settings.layout.definitions,
				style,
				selector: 'body',
				hasBlockGapSupport: true,
				hasFallbackGapSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				':where(body .is-layout-flow) > * { margin-block-start: 0; margin-block-end: 0; }:where(body .is-layout-flow) > * + * { margin-block-start: 12px; margin-block-end: 0; }:where(body .is-layout-flex) { gap: 12px; }body { --wp--style--block-gap: 12px; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return real gap layout style if blockGap is enabled', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				layoutDefinitions:
					layoutDefinitionsTree.settings.layout.definitions,
				style,
				selector: '.wp-block-group',
				hasBlockGapSupport: true,
				hasFallbackGapSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				'.wp-block-group-is-layout-flow > * { margin-block-start: 0; margin-block-end: 0; }.wp-block-group-is-layout-flow > * + * { margin-block-start: 12px; margin-block-end: 0; }.wp-block-group-is-layout-flex { gap: 12px; }'
			);
		} );

		it( 'should return fallback gap flex layout style for a block if blockGap is disabled, and a fallback value is provided', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				layoutDefinitions:
					layoutDefinitionsTree.settings.layout.definitions,
				style,
				selector: '.wp-block-group',
				hasBlockGapSupport: false, // This means that the fallback value will be used instead of the "real" one.
				hasFallbackGapSupport: true,
				fallbackGapValue: '2em',
			} );

			expect( layoutStyles ).toEqual(
				':where(.wp-block-group.is-layout-flex) { gap: 2em; }'
			);
		} );
	} );

	describe( 'getBlockSelectors', () => {
		it( 'should return block selectors data', () => {
			const imageSelectors = {
				root: '.my-image',
				border: '.my-image img, .my-image .crop-area',
				filter: { duotone: 'img' },
			};
			const imageBlock = {
				name: 'core/image',
				selectors: imageSelectors,
			};
			const blockTypes = [ imageBlock ];
			const getBlockStyles = () => [ { name: 'foo' } ];

			expect( getBlockSelectors( blockTypes, getBlockStyles ) ).toEqual( {
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
						foo: '.is-style-foo.my-image',
					},
					hasLayoutSupport: false,
				},
			} );
		} );

		it( 'should return block selectors data with old experimental selectors', () => {
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
			const imageBlock = { name: 'core/image', supports: imageSupports };
			const blockTypes = [ imageBlock ];

			expect( getBlockSelectors( blockTypes, () => {} ) ).toEqual( {
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

	describe( 'getStylesDeclarations', () => {
		const blockStyles = {
			spacing: {
				padding: {
					top: '33px',
					right: '33px',
					bottom: '33px',
					left: '33px',
				},
			},
			color: {
				background: 'var:preset|color|light-green-cyan',
			},
			typography: {
				fontFamily: 'sans-serif',
				fontSize: '15px',
			},
		};

		it( 'should output padding variables and other properties if useRootPaddingAwareAlignments is enabled', () => {
			expect(
				getStylesDeclarations( blockStyles, 'body', true )
			).toEqual( [
				'--wp--style--root--padding-top: 33px',
				'--wp--style--root--padding-right: 33px',
				'--wp--style--root--padding-bottom: 33px',
				'--wp--style--root--padding-left: 33px',
				'background-color: var(--wp--preset--color--light-green-cyan)',
				'font-family: sans-serif',
				'font-size: 15px',
			] );
		} );

		it( 'should output padding and other properties if useRootPaddingAwareAlignments is disabled', () => {
			expect(
				getStylesDeclarations( blockStyles, 'body', false )
			).toEqual( [
				'background-color: var(--wp--preset--color--light-green-cyan)',
				'padding-top: 33px',
				'padding-right: 33px',
				'padding-bottom: 33px',
				'padding-left: 33px',
				'font-family: sans-serif',
				'font-size: 15px',
			] );
		} );

		it( 'should not output padding variables if selector is not root', () => {
			expect(
				getStylesDeclarations(
					blockStyles,
					'.wp-block-button__link',
					true
				)
			).toEqual( [
				'background-color: var(--wp--preset--color--light-green-cyan)',
				'padding-top: 33px',
				'padding-right: 33px',
				'padding-bottom: 33px',
				'padding-left: 33px',
				'font-family: sans-serif',
				'font-size: 15px',
			] );
		} );

		it( 'should output clamp values for font-size when fluid typography is enabled', () => {
			expect(
				getStylesDeclarations(
					blockStyles,
					'.wp-block-site-title',
					true,
					{
						settings: {
							typography: {
								fluid: true,
							},
						},
					}
				)
			).toEqual( [
				'background-color: var(--wp--preset--color--light-green-cyan)',
				'padding-top: 33px',
				'padding-right: 33px',
				'padding-bottom: 33px',
				'padding-left: 33px',
				'font-family: sans-serif',
				'font-size: clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.078), 15px)',
			] );
		} );

		it( 'should output direct values for font-size when fluid typography is disabled', () => {
			expect(
				getStylesDeclarations(
					blockStyles,
					'.wp-block-site-title',
					true,
					{
						settings: {
							typography: {
								fluid: false,
							},
						},
					}
				)
			).toEqual( [
				'background-color: var(--wp--preset--color--light-green-cyan)',
				'padding-top: 33px',
				'padding-right: 33px',
				'padding-bottom: 33px',
				'padding-left: 33px',
				'font-family: sans-serif',
				'font-size: 15px',
			] );
		} );
	} );
} );
