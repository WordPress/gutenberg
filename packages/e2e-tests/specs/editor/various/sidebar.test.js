/**
 * WordPress dependencies
 */
import {
	clearLocalStorage,
	createNewPost,
	findDocumentSettingsSectionWithTitle,
	enableFocusLossObservation,
	disableFocusLossObservation,
	openDocumentSettings,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

const SIDEBAR_SELECTOR = '.edit-post-sidebar';

describe( 'Sidebar', () => {
	afterEach( () => {
		disableFocusLossObservation();
	} );

	it( 'should have sidebar visible at the start with block inspector active on desktop', async () => {
		await setBrowserViewport( 'large' );
		await clearLocalStorage();
		await createNewPost();
		await enableFocusLossObservation();

		// Expect block inspector sidebar to be open.
		const blockInspector = await page.$(
			'.block-editor-block-inspector__no-blocks'
		);
		expect( blockInspector ).not.toBeNull();
	} );

	it( 'should have the sidebar closed by default on mobile', async () => {
		await setBrowserViewport( 'small' );
		await clearLocalStorage();
		await createNewPost();
		await enableFocusLossObservation();
		const sidebar = await page.$( SIDEBAR_SELECTOR );
		expect( sidebar ).toBeNull();
	} );

	it( 'should close the sidebar when resizing from desktop to mobile', async () => {
		await setBrowserViewport( 'large' );
		await clearLocalStorage();
		await createNewPost();
		await enableFocusLossObservation();

		const sidebars = await page.$$( SIDEBAR_SELECTOR );
		expect( sidebars ).toHaveLength( 1 );

		await setBrowserViewport( 'small' );

		const sidebarsMobile = await page.$$( SIDEBAR_SELECTOR );
		// sidebar should be closed when resizing to mobile.
		expect( sidebarsMobile ).toHaveLength( 0 );
	} );

	it( 'should reopen sidebar the sidebar when resizing from mobile to desktop if the sidebar was closed automatically', async () => {
		await setBrowserViewport( 'large' );
		await clearLocalStorage();
		await createNewPost();
		await enableFocusLossObservation();
		await setBrowserViewport( 'small' );

		const sidebarsMobile = await page.$$( SIDEBAR_SELECTOR );
		expect( sidebarsMobile ).toHaveLength( 0 );

		await setBrowserViewport( 'large' );

		await page.waitForSelector( SIDEBAR_SELECTOR );
	} );

	it( 'should be possible to programmatically remove Document Settings panels', async () => {
		await createNewPost();
		await enableFocusLossObservation();
		await openDocumentSettings();

		expect(
			await findDocumentSettingsSectionWithTitle( 'Categories' )
		).toBeDefined();
		expect(
			await findDocumentSettingsSectionWithTitle( 'Tags' )
		).toBeDefined();
		expect(
			await findDocumentSettingsSectionWithTitle( 'Featured image' )
		).toBeDefined();
		expect(
			await findDocumentSettingsSectionWithTitle( 'Excerpt' )
		).toBeDefined();
		expect(
			await findDocumentSettingsSectionWithTitle( 'Discussion' )
		).toBeDefined();
		expect(
			await findDocumentSettingsSectionWithTitle( 'Status & visibility' )
		).toBeDefined();

		await page.evaluate( () => {
			const { removeEditorPanel } = wp.data.dispatch( 'core/edit-post' );

			removeEditorPanel( 'taxonomy-panel-category' );
			removeEditorPanel( 'taxonomy-panel-post_tag' );
			removeEditorPanel( 'featured-image' );
			removeEditorPanel( 'post-excerpt' );
			removeEditorPanel( 'discussion-panel' );
			removeEditorPanel( 'post-status' );
		} );

		const getPanelToggleSelector = ( panelTitle ) => {
			return `//div[contains(@class, "edit-post-sidebar")]//button[contains(@class, "components-panel__body-toggle") and contains(text(),"${ panelTitle }")]`;
		};

		expect(
			await page.$x( getPanelToggleSelector( 'Categories' ) )
		).toEqual( [] );
		expect( await page.$x( getPanelToggleSelector( 'Tags' ) ) ).toEqual(
			[]
		);
		expect(
			await page.$x( getPanelToggleSelector( 'Featured image' ) )
		).toEqual( [] );
		expect( await page.$x( getPanelToggleSelector( 'Excerpt' ) ) ).toEqual(
			[]
		);
		expect(
			await page.$x( getPanelToggleSelector( 'Discussion' ) )
		).toEqual( [] );
		expect(
			await page.$x( getPanelToggleSelector( 'Status & visibility' ) )
		).toEqual( [] );
	} );
} );
