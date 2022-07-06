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
			};

			expect( toStyles( tree, blockSelectors ) ).toEqual(
				'body {margin: 0;}' +
					'body{background-color: red;margin: 10px;padding: 10px;}h1{font-size: 42px;}a{color: blue;}a:hover{color: orange;}a:focus{color: orange;}.wp-block-group{margin-top: 10px;margin-right: 20px;margin-bottom: 30px;margin-left: 40px;padding-top: 11px;padding-right: 22px;padding-bottom: 33px;padding-left: 44px;}h1,h2,h3,h4,h5,h6{color: orange;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: hotpink;}h1 a:hover,h2 a:hover,h3 a:hover,h4 a:hover,h5 a:hover,h6 a:hover{color: red;}h1 a:focus,h2 a:focus,h3 a:focus,h4 a:focus,h5 a:focus,h6 a:focus{color: red;}' +
					'.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }' +
					'.has-white-color{color: var(--wp--preset--color--white) !important;}.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}.has-black-color{color: var(--wp--preset--color--black) !important;}.has-black-background-color{background-color: var(--wp--preset--color--black) !important;}.has-black-border-color{border-color: var(--wp--preset--color--black) !important;}h1.has-blue-color,h2.has-blue-color,h3.has-blue-color,h4.has-blue-color,h5.has-blue-color,h6.has-blue-color{color: var(--wp--preset--color--blue) !important;}h1.has-blue-background-color,h2.has-blue-background-color,h3.has-blue-background-color,h4.has-blue-background-color,h5.has-blue-background-color,h6.has-blue-background-color{background-color: var(--wp--preset--color--blue) !important;}h1.has-blue-border-color,h2.has-blue-border-color,h3.has-blue-border-color,h4.has-blue-border-color,h5.has-blue-border-color,h6.has-blue-border-color{border-color: var(--wp--preset--color--blue) !important;}'
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
				tree: layoutDefinitionsTree,
				style,
				selector: 'body',
				hasBlockGapSupport: false,
				hasBlockStylesSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				'body .is-layout-flex { gap: 0.5em; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return fallback gap layout styles, and base styles, if blockGap is enabled, but there is no blockGap value', () => {
			const style = {};

			const layoutStyles = getLayoutStyles( {
				tree: layoutDefinitionsTree,
				style,
				selector: 'body',
				hasBlockGapSupport: true,
				hasBlockStylesSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				'body .is-layout-flow > * { margin-block-start: 0; margin-block-end: 0; }body .is-layout-flow > * + * { margin-block-start: 0.5em; margin-block-end: 0; }body .is-layout-flex { gap: 0.5em; }body { --wp--style--block-gap: 0.5em; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return real gap layout style if blockGap is enabled, and base styles', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				tree: layoutDefinitionsTree,
				style,
				selector: 'body',
				hasBlockGapSupport: true,
				hasBlockStylesSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				'body .is-layout-flow > * { margin-block-start: 0; margin-block-end: 0; }body .is-layout-flow > * + * { margin-block-start: 12px; margin-block-end: 0; }body .is-layout-flex { gap: 12px; }body { --wp--style--block-gap: 12px; }body .is-layout-flow > .alignleft { float: left; margin-inline-start: 0; margin-inline-end: 2em; }body .is-layout-flow > .alignright { float: right; margin-inline-start: 2em; margin-inline-end: 0; }body .is-layout-flow > .aligncenter { margin-left: auto !important; margin-right: auto !important; }body .is-layout-flex { display:flex; }body .is-layout-flex { flex-wrap: wrap; align-items: center; }body .is-layout-flex > * { margin: 0; }'
			);
		} );

		it( 'should return real gap layout style if blockGap is enabled', () => {
			const style = { spacing: { blockGap: '12px' } };

			const layoutStyles = getLayoutStyles( {
				tree: layoutDefinitionsTree,
				style,
				selector: '.wp-block-group',
				hasBlockGapSupport: true,
				hasBlockStylesSupport: true,
			} );

			expect( layoutStyles ).toEqual(
				'.wp-block-group.is-layout-flow > * { margin-block-start: 0; margin-block-end: 0; }.wp-block-group.is-layout-flow > * + * { margin-block-start: 12px; margin-block-end: 0; }.wp-block-group.is-layout-flex { gap: 12px; }'
			);
		} );
	} );
} );
