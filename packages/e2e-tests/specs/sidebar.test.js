/**
 * WordPress dependencies
 */
import {
	findSidebarPanelWithTitle,
	createNewPost,
	observeFocusLoss,
	openDocumentSettingsSidebar,
	pressKeyWithModifier,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

const SIDEBAR_SELECTOR = '.edit-post-sidebar';
const ACTIVE_SIDEBAR_TAB_SELECTOR = '.edit-post-sidebar__panel-tab.is-active';
const ACTIVE_SIDEBAR_BUTTON_TEXT = 'Document';

describe( 'Sidebar', () => {
	beforeAll( () => {
		observeFocusLoss();
	} );

	it( 'should have sidebar visible at the start with document sidebar active on desktop', async () => {
		await setBrowserViewport( 'large' );
		await createNewPost();
		const { nodesCount, content, height, width } = await page.$$eval( ACTIVE_SIDEBAR_TAB_SELECTOR, ( nodes ) => {
			const firstNode = nodes[ 0 ];
			return {
				nodesCount: nodes.length,
				content: firstNode.innerText,
				height: firstNode.offsetHeight,
				width: firstNode.offsetWidth,
			};
		} );

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
		await createNewPost();
		const sidebar = await page.$( SIDEBAR_SELECTOR );
		expect( sidebar ).toBeNull();
	} );

	it( 'should close the sidebar when resizing from desktop to mobile', async () => {
		await setBrowserViewport( 'large' );
		await createNewPost();

		const sidebars = await page.$$( SIDEBAR_SELECTOR );
		expect( sidebars ).toHaveLength( 1 );

		await setBrowserViewport( 'small' );

		const sidebarsMobile = await page.$$( SIDEBAR_SELECTOR );
		// sidebar should be closed when resizing to mobile.
		expect( sidebarsMobile ).toHaveLength( 0 );
	} );

	it( 'should reopen sidebar the sidebar when resizing from mobile to desktop if the sidebar was closed automatically', async () => {
		await setBrowserViewport( 'large' );
		await createNewPost();
		await setBrowserViewport( 'small' );

		const sidebarsMobile = await page.$$( SIDEBAR_SELECTOR );
		expect( sidebarsMobile ).toHaveLength( 0 );

		await setBrowserViewport( 'large' );

		const sidebarsDesktop = await page.$$( SIDEBAR_SELECTOR );
		expect( sidebarsDesktop ).toHaveLength( 1 );
	} );

	it( 'should preserve tab order while changing active tab', async () => {
		await createNewPost();

		// Region navigate to Sidebar.
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );

		// Tab lands at first (presumed selected) option "Document".
		await page.keyboard.press( 'Tab' );
		const isActiveDocumentTab = await page.evaluate( () => (
			document.activeElement.textContent === 'Document' &&
			document.activeElement.classList.contains( 'is-active' )
		) );
		expect( isActiveDocumentTab ).toBe( true );

		// Tab into and activate "Block".
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );
		const isActiveBlockTab = await page.evaluate( () => (
			document.activeElement.textContent === 'Block' &&
			document.activeElement.classList.contains( 'is-active' )
		) );
		expect( isActiveBlockTab ).toBe( true );
	} );

	it( 'should be possible to programmatically remove Document Settings panels', async () => {
		await createNewPost();

		await openDocumentSettingsSidebar();

		expect( await findSidebarPanelWithTitle( 'Categories' ) ).toBeDefined();
		expect( await findSidebarPanelWithTitle( 'Tags' ) ).toBeDefined();
		expect( await findSidebarPanelWithTitle( 'Featured Image' ) ).toBeDefined();
		expect( await findSidebarPanelWithTitle( 'Excerpt' ) ).toBeDefined();
		expect( await findSidebarPanelWithTitle( 'Discussion' ) ).toBeDefined();

		await page.evaluate( () => {
			const { removeEditorPanel } = wp.data.dispatch( 'core/edit-post' );

			removeEditorPanel( 'taxonomy-panel-category' );
			removeEditorPanel( 'taxonomy-panel-post_tag' );
			removeEditorPanel( 'featured-image' );
			removeEditorPanel( 'post-excerpt' );
			removeEditorPanel( 'discussion-panel' );
		} );

		expect( await findSidebarPanelWithTitle( 'Categories' ) ).toBeUndefined();
		expect( await findSidebarPanelWithTitle( 'Tags' ) ).toBeUndefined();
		expect( await findSidebarPanelWithTitle( 'Featured Image' ) ).toBeUndefined();
		expect( await findSidebarPanelWithTitle( 'Excerpt' ) ).toBeUndefined();
		expect( await findSidebarPanelWithTitle( 'Discussion' ) ).toBeUndefined();
	} );
} );
