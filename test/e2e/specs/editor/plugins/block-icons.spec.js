/**
 * WordPress dependencies
 */
// import {
// 	pressKeyWithModifier,
// } from '@wordpress/e2e-test-utils';
// const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// const INSERTER_BUTTON_SELECTOR =
// 	'.block-editor-inserter__main-area .block-editor-block-types-list__item';
// const INSERTER_ICON_WRAPPER_SELECTOR = `${ INSERTER_BUTTON_SELECTOR } .block-editor-block-types-list__item-icon`;
// const INSERTER_ICON_SELECTOR = `${ INSERTER_BUTTON_SELECTOR } .block-editor-block-icon`;
// const INSPECTOR_ICON_SELECTOR = '.edit-post-sidebar .block-editor-block-icon';

// async function getInnerHTML( selector ) {
// 	return await page.$eval( selector, ( element ) => element.innerHTML );
// }

// async function getBackgroundColor( selector ) {
// 	return await page.$eval( selector, ( element ) => {
// 		return window.getComputedStyle( element ).backgroundColor;
// 	} );
// }

// async function getColor( selector ) {
// 	return await page.$eval( selector, ( element ) => {
// 		return window.getComputedStyle( element ).color;
// 	} );
// }

// async function getFirstInserterIcon() {
// 	return await getInnerHTML( INSERTER_ICON_SELECTOR );
// }

// async function selectFirstBlock() {
// 	await pressKeyWithModifier( 'access', 'o' );
// 	const navButtons = await page.$$(
// 		'.block-editor-list-view-block-select-button'
// 	);
// 	await navButtons[ 0 ].click();
// }

// test.describe( 'Correctly Renders Block Icons on Inserter and Inspector', () => {
// 	const dashIconRegex = /<span.*?class=".*?dashicons-cart.*?">.*?<\/span>/;
// 	const circleString =
// 		'<circle cx="10" cy="10" r="10" fill="red" stroke="blue" stroke-width="10"></circle>';
// 	const svgIcon = new RegExp(
// 		`<svg.*?viewBox="0 0 20 20".*?>${ circleString }</svg>`
// 	);

// 	const validateSvgIcon = ( iconHtml ) => {
// 		expect( iconHtml ).toMatch( svgIcon );
// 	};

// 	const validateDashIcon = ( iconHtml ) => {
// 		expect( iconHtml ).toMatch( dashIconRegex );
// 	};

// 	test.beforeAll( async ({requestUtils}) => {
// 		await requestUtils.activatePlugin( 'gutenberg-test-block-icons' );
// 	} );

// 	test.beforeEach( async ({admin}) => {
// 		await admin.createNewPost();
// 	} );

// 	test.afterAll( async ({requestUtils}) => {
// 		await requestUtils.deactivatePlugin( 'gutenberg-test-block-icons' );
// 	} );

// 	function testIconsOfBlock( blockName, blockTitle, validateIcon ) {
// 		test('Renders correctly the icon in the inserter', async ({page}) => {
// 			await page
// 			.getByRole( 'button', { name: 'Toggle block inserter' } )
// 			.click();

// 		await page
// 			.getByRole( 'region', { name: 'Block Library' } )
// 			.getByRole( 'searchbox', {
// 				name: 'Search for blocks and patterns',
// 			} )
// 			.fill( 'blockTitle' );
// 			validateIcon( await getFirstInserterIcon() );
// 		} );

// 		test('Can insert the block', async ({editor,page}) => {
// 			await editor.insertBlock( blockTitle );
// 			expect(
// 				page.locator(
// 					`[data-type="${ blockName }"] [data-type="core/paragraph"]`
// 				)
// 			).toEqual( blockTitle );
// 		} );

// 		test('Renders correctly the icon on the inspector', async ({editor}) => {
// 			await editor.insertBlock( blockTitle );
// 			await editor.openDocumentSettingsSidebar();
// 			await selectFirstBlock();
// 			validateIcon( await getInnerHTML( INSPECTOR_ICON_SELECTOR ) );
// 		} );
// 	}

// 	test.describe( 'Block with svg icon', () => {
// 		const blockName = 'test/test-single-svg-icon';
// 		const blockTitle = 'TestSimpleSvgIcon';
// 		testIconsOfBlock( blockName, blockTitle, validateSvgIcon );
// 	} );

// 	test.describe( 'Block with dash icon', () => {
// 		const blockName = 'test/test-dash-icon';
// 		const blockTitle = 'TestDashIcon';
// 		testIconsOfBlock( blockName, blockTitle, validateDashIcon );
// 	} );

// 	test.describe( 'Block with function icon', () => {
// 		const blockName = 'test/test-function-icon';
// 		const blockTitle = 'TestFunctionIcon';
// 		testIconsOfBlock( blockName, blockTitle, validateSvgIcon );
// 	} );

// 	test.describe( 'Block with dash icon and background and foreground colors', () => {
// 		const blockTitle = 'TestDashIconColors';
// 		test('Renders the icon in the inserter with the correct colors', async () => {
// 			await page
// 			.getByRole( 'button', { name: 'Toggle block inserter' } )
// 			.click();

// 		await page
// 			.getByRole( 'region', { name: 'Block Library' } )
// 			.getByRole( 'searchbox', {
// 				name: 'Search for blocks and patterns',
// 			} )
// 			.fill( 'blockTitle' );
// 			validateDashIcon( await getFirstInserterIcon() );
// 			expect(
// 				await getBackgroundColor( INSERTER_ICON_WRAPPER_SELECTOR )
// 			).toEqual( 'rgb(1, 0, 0)' );
// 			expect( await getColor( INSERTER_ICON_WRAPPER_SELECTOR ) ).toEqual(
// 				'rgb(254, 0, 0)'
// 			);
// 		} );

// 		test('Renders the icon in the inspector with the correct colors', async ({editor}) => {
// 			await editor.insertBlock( blockTitle );
// 			await editor.openDocumentSettingsSidebar();
// 			await selectFirstBlock();
// 			validateDashIcon( await getInnerHTML( INSPECTOR_ICON_SELECTOR ) );
// 			expect(
// 				await getBackgroundColor( INSPECTOR_ICON_SELECTOR )
// 			).toEqual( 'rgb(1, 0, 0)' );
// 			expect( await getColor( INSPECTOR_ICON_SELECTOR ) ).toEqual(
// 				'rgb(254, 0, 0)'
// 			);
// 		} );
// 	} );

// 	test.describe( 'Block with svg icon and background color', () => {
// 		const blockTitle = 'TestSvgIconBackground';
// 		test('Renders the icon in the inserter with the correct background color and an automatically compute readable foreground color', async ( {page} ) => {
// 			await page
// 			.getByRole( 'button', { name: 'Toggle block inserter' } )
// 			.click();

// 		await page
// 			.getByRole( 'region', { name: 'Block Library' } )
// 			.getByRole( 'searchbox', {
// 				name: 'Search for blocks and patterns',
// 			} )
// 			.fill( 'blockTitle' );
// 			validateSvgIcon( await getFirstInserterIcon() );
// 			expect(
// 				await getBackgroundColor( INSERTER_ICON_WRAPPER_SELECTOR )
// 			).toEqual( 'rgb(1, 0, 0)' );
// 			expect( await getColor( INSERTER_ICON_WRAPPER_SELECTOR ) ).toEqual(
// 				'rgb(248, 249, 249)'
// 			);
// 		} );

// 		test('Renders correctly the icon on the inspector', async ({editor}) => {
// 			await editor.insertBlock( blockTitle );
// 			await editor.openDocumentSettingsSidebar();
// 			await selectFirstBlock();
// 			validateSvgIcon( await getInnerHTML( INSPECTOR_ICON_SELECTOR ) );
// 			expect(
// 				await getBackgroundColor( INSPECTOR_ICON_SELECTOR )
// 			).toEqual( 'rgb(1, 0, 0)' );
// 			expect( await getColor( INSPECTOR_ICON_SELECTOR ) ).toEqual(
// 				'rgb(248, 249, 249)'
// 			);
// 		} );
// 	} );
// } );
