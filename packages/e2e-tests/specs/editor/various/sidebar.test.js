/**
 * WordPress dependencies
 */
import {
	clearLocalStorage,
	createNewPost,
	findSidebarPanelWithTitle,
	enableFocusLossObservation,
	disableFocusLossObservation,
	openDocumentSettingsSidebar,
	pressKeyWithModifier,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

const SIDEBAR_SELECTOR = '.edit-post-sidebar';
const ACTIVE_SIDEBAR_TAB_SELECTOR = '.edit-post-sidebar__panel-tab.is-active';
const ACTIVE_SIDEBAR_BUTTON_TEXT = 'Post';

const openSidebarPanelWithTitle = async ( title ) => {
	const panel = await page.waitForXPath(
		`//div[contains(@class,"edit-post-sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ title }")]`
	);
	const expanded = await page.evaluate(
		( element ) => element.getAttribute( 'aria-expanded' ),
		panel
	);
	if ( expanded === 'false' ) {
		return panel.click();
	}
};

describe( 'Sidebar', () => {
	afterEach( () => {
		disableFocusLossObservation();
	} );

	it( 'should have sidebar visible at the start with document sidebar active on desktop', async () => {
		await setBrowserViewport( 'large' );
		await clearLocalStorage();
		await createNewPost();
		await enableFocusLossObservation();
		const { nodesCount, content, height, width } = await page.$$eval(
			ACTIVE_SIDEBAR_TAB_SELECTOR,
			( nodes ) => {
				const firstNode = nodes[ 0 ];
				return {
					nodesCount: nodes.length,
					content: firstNode.innerText,
					height: firstNode.offsetHeight,
					width: firstNode.offsetWidth,
				};
			}
		);

		// should have only one active sidebar tab.
		expect( nodesCount ).toBe( 1 );

		// the active sidebar tab should be document.
		expect( content ).toBe( ACTIVE_SIDEBAR_BUTTON_TEXT );

		// the active sidebar tab should be visible
		expect( width ).toBeGreaterThan( 10 );
		expect( height ).toBeGreaterThan( 10 );
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

	it( 'should preserve tab order while changing active tab', async () => {
		await createNewPost();
		await enableFocusLossObservation();

		// Region navigate to Sidebar.
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );

		// Tab lands at first (presumed selected) option "Post".
		await page.keyboard.press( 'Tab' );
		const isActiveDocumentTab = await page.evaluate(
			() =>
				document.activeElement.textContent === 'Post' &&
				document.activeElement.classList.contains( 'is-active' )
		);
		expect( isActiveDocumentTab ).toBe( true );

		// Tab into and activate "Block".
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );
		const isActiveBlockTab = await page.evaluate(
			() =>
				document.activeElement.textContent === 'Block' &&
				document.activeElement.classList.contains( 'is-active' )
		);
		expect( isActiveBlockTab ).toBe( true );
	} );

	it( 'should be possible to programmatically remove Document Settings panels', async () => {
		await createNewPost();
		await enableFocusLossObservation();
		await openDocumentSettingsSidebar();
		const panelNames = [
			'Summary',
			'Categories',
			'Tags',
			'Discussion',
			'Status & visibility',
		];
		const panels = await Promise.all(
			panelNames.map( findSidebarPanelWithTitle )
		);
		panels.forEach( ( panel ) => expect( panel ).toBeDefined() );

		await page.evaluate( () => {
			const { removeEditorPanel } = wp.data.dispatch( 'core/edit-post' );

			removeEditorPanel( 'taxonomy-panel-category' );
			removeEditorPanel( 'taxonomy-panel-post_tag' );
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
			await page.$x( getPanelToggleSelector( 'Discussion' ) )
		).toEqual( [] );
		expect(
			await page.$x( getPanelToggleSelector( 'Status & visibility' ) )
		).toEqual( [] );
	} );
	describe( 'Summary panel', () => {
		beforeEach( async () => {
			await createNewPost();
			await enableFocusLossObservation();
			await openDocumentSettingsSidebar();
		} );
		it( 'should show all elements', async () => {
			await openSidebarPanelWithTitle( 'Summary' );
			const getSelector = ( cssClass ) =>
				`//div[contains(@class, "edit-post-sidebar")]//div[contains(@class, "edit-post-post-summary")]//*[contains(@class, "${ cssClass }")]`;
			const panelElements = await Promise.all(
				[
					'editor-post-featured-image',
					'edit-post-post-title',
					'editor-post-excerpt',
					'post-author-selector',
				].map( ( target ) =>
					page.waitForXPath( getSelector( target ) )
				)
			);
			panelElements.forEach( ( element ) =>
				expect( element ).toBeDefined()
			);
		} );
	} );
} );
