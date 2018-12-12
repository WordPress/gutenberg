/**
 * Internal dependencies
 */
import {
	findSidebarPanelWithTitle,
	newPost,
	openDocumentSettingsSidebar,
	publishPost,
} from '../support/utils';

// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink panel.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
describe( 'Sidebar Permalink Panel', () => {
	it( 'should not render permalink sidebar panel while the post is new', async () => {
		await newPost();
		await openDocumentSettingsSidebar();
		expect( await findSidebarPanelWithTitle( 'Permalink' ) ).toBeUndefined();
	} );

	it( 'should render permalink sidebar panel after the post is published and allow its removal', async () => {
		await newPost();
		await page.keyboard.type( 'aaaaa' );
		await publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( await findSidebarPanelWithTitle( 'Permalink' ) ).toBeDefined();
		await page.evaluate( () => {
			const { removeEditorPanel } = wp.data.dispatch( 'core/edit-post' );
			removeEditorPanel( 'post-link' );
		} );
		expect( await findSidebarPanelWithTitle( 'Permalink' ) ).toBeUndefined();
	} );
} );
