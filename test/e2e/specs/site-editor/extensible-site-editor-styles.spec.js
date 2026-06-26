/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const EXPERIMENT = 'gutenberg-extensible-site-editor';
const NAVIGATION_ATTEMPTS = 3;
const PAGE_TITLE = 'Extensible editor styling regression';
const PAGE_CONTENT = 'Extensible editor sentinel content';
const STYLE_VARIATIONS_THEME = 'twentytwentyfive';
const STYLE_VARIATION_TITLE = 'Dusk';
const FONT_SENSITIVE_GLOBAL_COLOR_STYLES = {
	background: '#ffef0b',
	text: '#191911',
};
const YELLOW_BACKGROUND_COLOR = 'rgb(255, 239, 11)';
const YELLOW_TEXT_COLOR = 'rgb(25, 25, 17)';
const BODY_FONT_FAMILY = 'Fira Code';
const HEADING_FONT_FAMILY = 'Vollkorn';
const CAPTURE_SCREENSHOTS =
	process.env.CAPTURE_EXTENSIBLE_SITE_EDITOR_SCREENSHOTS === '1';
let testPageId;

function isExpectedGlobalStylesCollectionProbe( url ) {
	return /\/wp-json\/wp\/v2\/global-styles\?context=view/.test( url );
}

function recordBrowserErrors( page ) {
	const errors = [];

	page.on( 'console', ( message ) => {
		if ( message.type() === 'error' ) {
			const locationUrl = message.location().url;

			if ( isExpectedGlobalStylesCollectionProbe( locationUrl ) ) {
				return;
			}

			errors.push(
				locationUrl
					? `${ message.text() } (${ locationUrl })`
					: message.text()
			);
		}
	} );

	page.on( 'pageerror', ( error ) => {
		errors.push( error.message );
	} );

	return () => expect( errors ).toEqual( [] );
}

function recordCriticalRequestFailures( page ) {
	const failures = [];
	const criticalPathPattern =
		/\/wp\/v2\/(block-editor\/settings|global-styles|pages|templates|template-parts)|\.(woff2?|ttf|otf)(\?|$)/;

	page.on( 'requestfailed', ( request ) => {
		if ( request.failure()?.errorText === 'net::ERR_ABORTED' ) {
			return;
		}

		if ( criticalPathPattern.test( request.url() ) ) {
			failures.push(
				`${ request.method() } ${ request.url() } ${
					request.failure()?.errorText ?? ''
				}`.trim()
			);
		}
	} );

	page.on( 'response', ( response ) => {
		if (
			response.status() === 404 &&
			isExpectedGlobalStylesCollectionProbe( response.url() )
		) {
			return;
		}

		if (
			response.status() >= 400 &&
			criticalPathPattern.test( response.url() )
		) {
			failures.push( `${ response.status() } ${ response.url() }` );
		}
	} );

	return () => expect( failures ).toEqual( [] );
}

async function applyFontSensitiveGlobalStyles( requestUtils ) {
	const stylesPostId = await requestUtils.getCurrentThemeGlobalStylesPostId();

	if ( ! stylesPostId ) {
		throw new Error( 'Could not find the current theme global styles ID.' );
	}

	const variations = await requestUtils.rest( {
		path: `/wp/v2/global-styles/themes/${ STYLE_VARIATIONS_THEME }/variations?context=view`,
	} );
	const styleVariation = variations.find(
		( variation ) => variation.title === STYLE_VARIATION_TITLE
	);

	if ( ! styleVariation ) {
		throw new Error(
			`Could not find the ${ STYLE_VARIATION_TITLE } style variation.`
		);
	}

	await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/global-styles/${ stylesPostId }`,
		data: {
			id: stylesPostId,
			settings: styleVariation.settings ?? {},
			styles: {
				...( styleVariation.styles ?? {} ),
				color: FONT_SENSITIVE_GLOBAL_COLOR_STYLES,
			},
		},
	} );
}

async function getCanvasFrame( page ) {
	const iframe = page.locator( 'iframe[name="editor-canvas"]' );
	await expect( iframe ).toBeVisible( { timeout: 15000 } );
	const iframeHandle = await iframe.elementHandle();
	const frame = await iframeHandle?.contentFrame();

	if ( ! frame ) {
		throw new Error( 'Editor canvas frame was not available.' );
	}

	return frame;
}

async function waitForCanvasLoaded( page ) {
	await expect
		.poll( async () => {
			const iframeHandle = await page
				.locator( 'iframe[name="editor-canvas"]' )
				.elementHandle();
			const frame = await iframeHandle?.contentFrame();

			if ( ! frame ) {
				return false;
			}

			return frame
				.evaluate(
					() => document.readyState === 'complete' && !! document.body
				)
				.catch( () => false );
		} )
		.toBe( true );

	const frame = await getCanvasFrame( page );
	await expect( frame.locator( 'body' ) ).toBeVisible();

	return frame;
}

async function expectCanvasHasGlobalColors( page ) {
	const frame = await waitForCanvasLoaded( page );

	await expect
		.poll( async () => {
			return frame.evaluate(
				() => window.getComputedStyle( document.body ).backgroundColor
			);
		} )
		.toBe( YELLOW_BACKGROUND_COLOR );

	await expect
		.poll( async () => {
			return frame.evaluate(
				() => window.getComputedStyle( document.body ).color
			);
		} )
		.toBe( YELLOW_TEXT_COLOR );

	return frame;
}

async function expectCanvasUsesFontFace(
	page,
	expectedFontFamily,
	selector = 'body'
) {
	const frame = await waitForCanvasLoaded( page );

	await expect
		.poll( async () => {
			return frame.evaluate(
				( cssSelector ) =>
					document.querySelector( cssSelector )
						? window.getComputedStyle(
								document.querySelector( cssSelector )
						  ).fontFamily
						: '',
				selector
			);
		} )
		.toContain( expectedFontFamily );

	await expect
		.poll( async () => {
			return frame.evaluate( async ( fontFamily ) => {
				await document.fonts.ready;

				return Array.from( document.fonts ).some(
					( fontFace ) =>
						fontFace.family.replace( /['"]/g, '' ) === fontFamily &&
						fontFace.status === 'loaded'
				);
			}, expectedFontFamily );
		} )
		.toBe( true );

	return frame;
}

async function expectCanvasUsesThemeFonts( page ) {
	await expectCanvasUsesFontFace( page, BODY_FONT_FAMILY );
	return expectCanvasUsesFontFace( page, HEADING_FONT_FAMILY, 'h1' );
}

async function maybeCaptureLoadedScreenshot( page, name ) {
	if ( ! CAPTURE_SCREENSHOTS ) {
		return;
	}

	const artifactPath = path.join(
		process.env.WP_ARTIFACTS_PATH || 'artifacts',
		'extensible-site-editor-styles'
	);
	fs.mkdirSync( artifactPath, { recursive: true } );

	await page.screenshot( {
		path: path.join( artifactPath, `${ name }.png` ),
		fullPage: true,
	} );

	await page.locator( 'iframe[name="editor-canvas"]' ).screenshot( {
		path: path.join( artifactPath, `${ name }-canvas.png` ),
	} );
}

async function visitStylesVariationsViaUi( admin, page ) {
	await admin.visitAdminPage( 'admin.php', 'page=site-editor-v2' );

	const sidebar = page.locator( '.boot-layout__sidebar' );
	await expect( sidebar ).toBeVisible( { timeout: 15000 } );

	await sidebar.getByText( 'Styles', { exact: true } ).click();
	await expect( page ).toHaveURL( /p=%2Fstyles/ );
	await waitForCanvasLoaded( page );

	await page.getByRole( 'button', { name: /Browse styles/i } ).click();
	await expect( page ).toHaveURL( /p=%2Fstyles%3Fsection%3D%252Fvariations/ );
	await waitForCanvasLoaded( page );
}

async function navigateSidebar(
	page,
	label,
	urlPattern,
	{ waitForCanvas = true } = {}
) {
	await page
		.locator( '.boot-layout__sidebar' )
		.getByText( label, { exact: true } )
		.click();
	await expect( page ).toHaveURL( urlPattern );
	if ( waitForCanvas ) {
		await waitForCanvasLoaded( page );
	}
}

async function expectPageEditorCanvasStyled( page, requestUtils ) {
	await ensureCreatedPageHasContent( requestUtils, testPageId );
	await expectCanvasHasGlobalColors( page );
	const frame = await expectCanvasUsesThemeFonts( page );
	await expect( frame.getByText( PAGE_TITLE ) ).toBeVisible();
	await expect( frame.getByText( PAGE_CONTENT ) ).toBeVisible();

	return frame;
}

async function ensureCreatedPageHasContent( requestUtils, pageId ) {
	const createdPage = await requestUtils.rest( {
		path: `/wp/v2/pages/${ pageId }?context=edit`,
	} );
	const rawContent = createdPage?.content?.raw ?? '';
	const renderedContent = createdPage?.content?.rendered ?? '';

	if (
		! rawContent.includes( PAGE_CONTENT ) &&
		! renderedContent.includes( PAGE_CONTENT )
	) {
		throw new Error(
			`Created test page ${ pageId } does not contain the sentinel content.`
		);
	}
}

test.describe( 'Extensible Site Editor styling', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( STYLE_VARIATIONS_THEME );
		await requestUtils.resetThemeGlobalStyles();
		await applyFontSensitiveGlobalStyles( requestUtils );
		await requestUtils.setGutenbergExperiments( [ EXPERIMENT ] );
		await requestUtils.deleteAllPages();

		const testPage = await requestUtils.createPage( {
			title: PAGE_TITLE,
			content: `<!-- wp:paragraph -->\n<p>${ PAGE_CONTENT }</p>\n<!-- /wp:paragraph -->`,
			status: 'publish',
		} );
		testPageId = testPage.id;
		await ensureCreatedPageHasContent( requestUtils, testPageId );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'preserves styles when opening a page editor canvas from the pages list', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const assertNoCriticalRequestFailures =
			recordCriticalRequestFailures( page );
		const assertNoBrowserErrors = recordBrowserErrors( page );

		for ( let attempt = 0; attempt < NAVIGATION_ATTEMPTS; attempt++ ) {
			await admin.visitAdminPage(
				'admin.php',
				'page=site-editor-v2&p=%2Ftypes%2Fpage%2Flist%2Fall'
			);

			const titleLocator = page.getByText( PAGE_TITLE, { exact: true } );
			await expect( titleLocator ).toBeVisible();
			await titleLocator.click();

			await expectPageEditorCanvasStyled( page, requestUtils );

			await maybeCaptureLoadedScreenshot(
				page,
				`page-editor-canvas-${ attempt + 1 }`
			);
		}
		assertNoCriticalRequestFailures();
		assertNoBrowserErrors();
	} );

	test( 'preserves styles when opening a page editor directly and after browsing via the UI', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const assertNoCriticalRequestFailures =
			recordCriticalRequestFailures( page );
		const assertNoBrowserErrors = recordBrowserErrors( page );

		for ( let attempt = 0; attempt < NAVIGATION_ATTEMPTS; attempt++ ) {
			await admin.visitAdminPage(
				'admin.php',
				`page=site-editor-v2&p=%2Ftypes%2Fpage%2Fedit%2F${ testPageId }`
			);
			await expectPageEditorCanvasStyled( page, requestUtils );

			await admin.visitAdminPage( 'admin.php', 'page=site-editor-v2' );
			await expect(
				page.locator( '.boot-layout__sidebar' )
			).toBeVisible();
			await navigateSidebar( page, 'Pages', /p=%2Ftypes%2Fpage/, {
				waitForCanvas: false,
			} );

			await page.getByText( PAGE_TITLE, { exact: true } ).click();
			await expectPageEditorCanvasStyled( page, requestUtils );

			await maybeCaptureLoadedScreenshot(
				page,
				`page-editor-ui-browse-${ attempt + 1 }`
			);
		}
		assertNoCriticalRequestFailures();
		assertNoBrowserErrors();
	} );

	test( 'preserves styles when navigating from the root to style variations', async ( {
		admin,
		page,
	} ) => {
		const assertNoCriticalRequestFailures =
			recordCriticalRequestFailures( page );
		const assertNoBrowserErrors = recordBrowserErrors( page );

		for ( let attempt = 0; attempt < NAVIGATION_ATTEMPTS; attempt++ ) {
			await visitStylesVariationsViaUi( admin, page );

			const styleVariation = page
				.getByRole( 'button', {
					name: new RegExp( STYLE_VARIATION_TITLE, 'i' ),
				} )
				.first();
			await expect( styleVariation ).toBeVisible();
			await styleVariation.click();
			await expectCanvasUsesThemeFonts( page );

			await maybeCaptureLoadedScreenshot(
				page,
				`style-variations-canvas-${ attempt + 1 }`
			);
		}
		assertNoCriticalRequestFailures();
		assertNoBrowserErrors();
	} );

	test( 'preserves styles when navigating between the root and styles routes', async ( {
		admin,
		page,
	} ) => {
		const assertNoCriticalRequestFailures =
			recordCriticalRequestFailures( page );
		const assertNoBrowserErrors = recordBrowserErrors( page );

		for ( let attempt = 0; attempt < NAVIGATION_ATTEMPTS; attempt++ ) {
			await admin.visitAdminPage( 'admin.php', 'page=site-editor-v2' );
			await expect(
				page.locator( '.boot-layout__sidebar' )
			).toBeVisible();
			await expectCanvasUsesThemeFonts( page );

			await navigateSidebar( page, 'Styles', /p=%2Fstyles/ );
			await expectCanvasUsesThemeFonts( page );

			await navigateSidebar(
				page,
				'Home',
				/page=site-editor-v2(&p=%2F)?$/
			);
			await expectCanvasUsesThemeFonts( page );

			await admin.visitAdminPage(
				'admin.php',
				'page=site-editor-v2&p=%2Fstyles'
			);
			await expectCanvasUsesThemeFonts( page );

			await navigateSidebar(
				page,
				'Home',
				/page=site-editor-v2(&p=%2F)?$/
			);
			await expectCanvasUsesThemeFonts( page );

			await navigateSidebar( page, 'Styles', /p=%2Fstyles/ );
			await expectCanvasUsesThemeFonts( page );

			await maybeCaptureLoadedScreenshot(
				page,
				`root-styles-transition-${ attempt + 1 }`
			);
		}
		assertNoCriticalRequestFailures();
		assertNoBrowserErrors();
	} );
} );
