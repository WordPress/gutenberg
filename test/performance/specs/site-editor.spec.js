/* eslint-disable playwright/no-conditional-in-test, playwright/expect-expect */

/**
 * WordPress dependencies
 */
import { test, Metrics } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { PerfUtils } from '../fixtures';

// See https://github.com/WordPress/gutenberg/issues/51383#issuecomment-1613460429
const BROWSER_IDLE_WAIT = 1000;

const results = {
	serverResponse: [],
	firstPaint: [],
	domContentLoaded: [],
	loaded: [],
	firstContentfulPaint: [],
	firstBlock: [],
	type: [],
	typeContainer: [],
	focus: [],
	inserterOpen: [],
	inserterHover: [],
	inserterSearch: [],
	listViewOpen: [],
	navigate: [],
	loadPatterns: [],
	loadPages: [],
};

test.describe( 'Site Editor Performance', () => {
	test.use( {
		perfUtils: async ( { page }, use ) => {
			await use( new PerfUtils( { page } ) );
		},
		metrics: async ( { page }, use ) => {
			await use( new Metrics( { page } ) );
		},
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils }, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );

		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Loading', () => {
		let draftId = null;

		test( 'Setup the test page', async ( { admin, perfUtils } ) => {
			await admin.createNewPost( { postType: 'page' } );
			await perfUtils.loadBlocksForLargePost();

			draftId = await perfUtils.saveDraft();
		} );

		const samples = 10;
		const throwaway = 1;
		const iterations = samples + throwaway;
		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run the test (${ i } of ${ iterations })`, async ( {
				admin,
				perfUtils,
				metrics,
			} ) => {
				// Go to the test draft.
				await admin.visitSiteEditor( {
					postId: draftId,
					postType: 'page',
					canvas: 'edit',
				} );

				// Wait for the first block.
				const canvas = await perfUtils.getCanvas();
				await canvas.locator( '.wp-block' ).first().waitFor();

				// Get the durations.
				const loadingDurations = await metrics.getLoadingDurations();

				// Save the results.
				if ( i > throwaway ) {
					Object.entries( loadingDurations ).forEach(
						( [ metric, duration ] ) => {
							if ( metric === 'timeSinceResponseEnd' ) {
								results.firstBlock.push( duration );
							} else {
								results[ metric ].push( duration );
							}
						}
					);

					const serverTiming = await metrics.getServerTiming();

					for ( const [ key, value ] of Object.entries(
						serverTiming
					) ) {
						results[ key ] ??= [];
						results[ key ].push( value );
					}
				}
			} );
		}
	} );

	test.describe( 'Typing', () => {
		let draftId = null;

		test( 'Setup the test post', async ( { admin, editor, perfUtils } ) => {
			await admin.createNewPost( { postType: 'page' } );
			await perfUtils.loadBlocksForLargePost();
			await editor.insertBlock( { name: 'core/paragraph' } );

			draftId = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { admin, perfUtils, metrics, page } ) => {
			// Go to the test draft.
			await admin.visitSiteEditor( {
				postId: draftId,
				postType: 'page',
				canvas: 'edit',
			} );

			// Enter edit mode (second click is needed for the legacy edit mode).
			const canvas = await perfUtils.getCanvas();

			// Run the test with the sidebar closed
			const toggleSidebarButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', {
					name: 'Settings',
					disabled: false,
				} );
			const isClosed =
				( await toggleSidebarButton.getAttribute(
					'aria-expanded'
				) ) === 'false';
			if ( ! isClosed ) {
				await toggleSidebarButton.click();
			}

			await canvas
				.getByRole( 'document', { name: /Block:( Post)? Content/ } )
				.click();

			const paragraph = canvas.getByRole( 'document', {
				name: /Empty block/i,
			} );

			// The first character typed triggers a longer time (isTyping change).
			// It can impact the stability of the metric, so we exclude it. It
			// probably deserves a dedicated metric itself, though.
			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;

			// Start tracing.
			await metrics.startTracing();

			// Type the testing sequence into the empty paragraph.
			await paragraph.type( 'x'.repeat( iterations ), {
				delay: BROWSER_IDLE_WAIT,
				// The extended timeout is needed because the typing is very slow
				// and the `delay` value itself does not extend it.
				timeout: iterations * BROWSER_IDLE_WAIT * 2, // 2x the total time to be safe.
			} );

			// Stop tracing.
			await metrics.stopTracing();

			// Get the durations.
			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				metrics.getTypingEventDurations();

			// Save the results.
			for ( let i = throwaway; i < iterations; i++ ) {
				results.type.push(
					keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
				);
			}
		} );
	} );

	test.describe( 'Navigating', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		const iterations = 5;
		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run the test (${ i } of ${ iterations })`, async ( {
				admin,
				page,
				metrics,
			} ) => {
				await admin.visitSiteEditor( {
					// The old URL is supported in both previous versions and new versions.
					path: '/wp_template',
				} );

				// The Templates index page has changed, so we need to know which UI is in use in the branch.
				// We do so by checking the presence of the dataviews component.
				// If it's there, switch to the list layout before running the test.
				// See https://github.com/WordPress/gutenberg/pull/59792
				const isDataViewsUI = await page
					.getByRole( 'button', { name: 'Layout' } )
					.isVisible();
				if ( isDataViewsUI ) {
					await page
						.getByRole( 'button', { name: 'Layout' } )
						.click();
					await page
						.getByRole( 'menuitemradio' )
						.filter( { has: page.getByText( 'List' ) } )
						.click();
				}

				await metrics.startTracing();
				await page.getByText( 'Single Posts', { exact: true } ).click();
				await metrics.stopTracing();

				// Get the durations.
				const [ mouseClickEvents ] = metrics.getClickEventDurations();

				// Save the results.
				results.navigate.push( mouseClickEvents[ 0 ] );
			} );
		}
	} );

	test.describe( 'Loading Patterns', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test( 'Run the test', async ( {
			page,
			admin,
			perfUtils,
			editor,
			requestUtils,
		} ) => {
			await Promise.all(
				Array.from( { length: 10 }, async () => {
					const { id } = await requestUtils.createPost( {
						status: 'publish',
						title: 'A post',
						content: `
<!-- wp:heading -->
<p>Hello</p>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Post content</p>
<!-- /wp:paragraph -->`,
					} );

					return id;
				} )
			);

			const samples = 10;
			for ( let i = 1; i <= samples; i++ ) {
				// We want to start from a fresh state each time, without
				// queries or patterns already cached.
				await admin.visitSiteEditor( {
					postId: 'twentytwentyfour//home',
					postType: 'wp_template',
					canvas: 'edit',
				} );
				await editor.openDocumentSettingsSidebar();

				/*
				 * https://github.com/WordPress/gutenberg/pull/55091 updated the HTML by
				 * removing the replace template button in sidebar-edit-mode/template-panel/replace-template-button.js
				 * with a "transform into" list. https://github.com/WordPress/gutenberg/pull/59259 made these tests
				 * compatible with the new UI, however, the performance tests compare previous versions of the UI.
				 *
				 * The following code is a workaround to test the performance of the new UI.
				 * `actionsButtonElement` is used to check if the old UI is present.
				 * If there is a Replace template button (old UI), click it, otherwise, click the "transform into" button.
				 * Once the performance tests are updated to compare compatible versions this code can be removed.
				 */
				// eslint-disable-next-line no-restricted-syntax
				const isActionsButtonVisible = await page
					.locator(
						'.edit-site-template-card__actions button[aria-label="Actions"]'
					)
					.isVisible();

				if ( isActionsButtonVisible ) {
					await page
						.getByRole( 'button', {
							name: 'Actions',
						} )
						.click();
				}

				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax, playwright/no-wait-for-timeout
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				const startTime = performance.now();

				if ( isActionsButtonVisible ) {
					await page
						.getByRole( 'menuitem', { name: 'Replace template' } )
						.click();
				} else {
					await page
						.getByRole( 'button', { name: 'Design' } )
						.or(
							// Locator for backward compatibility with the old UI.
							// The label was updated in https://github.com/WordPress/gutenberg/pull/62161.
							page.getByRole( 'button', {
								name: 'Transform into:',
							} )
						)
						.click();
				}

				const patterns = [
					'Blogging home template',
					'Business home template',
					'Portfolio home template with post featured images',
					'Blogging index template',
				];

				await Promise.all(
					patterns.map( async ( pattern ) => {
						const canvas = await perfUtils.getCanvas(
							page
								.getByRole( 'option', {
									name: pattern,
									exact: true,
								} )
								.getByTitle( 'Editor canvas' )
						);

						// Wait until the first block is rendered AND all
						// patterns are replaced.
						await Promise.all( [
							canvas.locator( '.wp-block' ).first().waitFor(),
							page.waitForFunction(
								() =>
									document.querySelectorAll(
										'[data-type="core/pattern"]'
									).length === 0
							),
						] );
					} )
				);

				const endTime = performance.now();

				results.loadPatterns.push( endTime - startTime );

				await page.keyboard.press( 'Escape' );
			}
		} );
	} );

	test.describe( 'Loading Pages', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		const perPage = 20;

		test( 'Run the test', async ( { page, admin, requestUtils } ) => {
			await Promise.all(
				Array.from( { length: perPage }, async ( el, index ) => {
					const { id } = await requestUtils.createPage( {
						status: 'publish',
						title: `Page (${ index })`,
						content: `
<!-- wp:heading -->
<p>Hello</p>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Post content</p>
<!-- /wp:paragraph -->`,
					} );

					return id;
				} )
			);

			await admin.visitSiteEditor();
			await page.getByRole( 'button', { name: 'Pages' } ).click();

			// Check if we're dealing with the old URL structure.
			const path = new URL( page.url() ).searchParams.get( 'path' );

			const samples = 10;
			for ( let i = 1; i <= samples; i++ ) {
				// Start from the trash view, then navigate to all pages, so we
				// test item loading rather than site editor load as a whole.
				// For some reason `visiSiteEditor` does not work with these
				// parameters.
				await admin.visitAdminPage(
					path
						? 'site-editor.php?path=%2Fpage&layout=table&activeView=trash'
						: 'site-editor.php?postType=page&layout=table&activeView=trash'
				);

				const startTime = performance.now();

				await page.getByRole( 'button', { name: 'All Pages' } ).click();

				// Wait for all pages to be rendered.
				await Promise.all(
					Array.from( { length: perPage }, async ( el, index ) => {
						return await page
							.getByLabel( `Page (${ index })` )
							.waitFor( { state: 'attached' } );
					} )
				);

				const endTime = performance.now();

				results.loadPages.push( endTime - startTime );
			}
		} );
	} );
} );

/* eslint-enable playwright/no-conditional-in-test, playwright/expect-expect */
