/**
 * WordPress dependencies
 */
import {
	test,
	expect,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import CollaborationUtils, {
	setCollaboration,
} from './fixtures/collaboration-utils';

type RestField = { raw?: string; rendered?: string } | string;
type RestPost = {
	content?: RestField;
	id: number;
	status: string;
	title?: RestField;
};

function rawField( field?: RestField ): string {
	if ( ! field ) {
		return '';
	}

	return typeof field === 'string'
		? field
		: field.raw ?? field.rendered ?? '';
}

async function getCurrentPostId( page: {
	evaluate: < T >( callback: () => T ) => Promise< T >;
} ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

async function waitForEditorReady( page: {
	waitForFunction: (
		callback: () => boolean,
		arg?: unknown,
		options?: { timeout?: number }
	) => Promise< unknown >;
} ) {
	await page.waitForFunction(
		() =>
			( window as any )._wpCollaborationEnabled === true &&
			!! ( window as any ).wp?.data &&
			!! ( window as any ).wp?.blocks,
		undefined,
		{ timeout: 30_000 }
	);
}

async function insertPostContent( {
	editor,
	marker,
	page,
	title,
}: {
	editor: any;
	marker: string;
	page: any;
	title: string;
} ) {
	await editor.canvas
		.getByRole( 'textbox', { name: 'Add title' } )
		.fill( title );
	await editor.canvas
		.getByRole( 'button', { name: 'Add default block' } )
		.click();
	await page.keyboard.type( marker );
}

async function getPost(
	requestUtils: RequestUtils,
	postId: number
): Promise< RestPost > {
	return requestUtils.rest< RestPost >( {
		path: `/wp/v2/posts/${ postId }`,
		params: {
			context: 'edit',
		},
	} );
}

async function assertNoConnectionModal( page: any ) {
	await expect(
		page.getByRole( 'dialog', { name: 'Connection lost' } )
	).toBeHidden();
	await expect(
		page.getByRole( 'dialog', { name: 'Connection expired' } )
	).toBeHidden();
	await expect(
		page.getByRole( 'dialog', { name: 'Too many editors connected' } )
	).toBeHidden();
}

test.describe( 'Collaboration - same-user saved draft reopen loss', () => {
	test( 'control: saved new draft content is visible after reopening without another same-account window', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 90_000 );

		await setCollaboration( requestUtils, true );

		const title = `Single window saved draft ${ Date.now() }`;
		const marker = `single-window-saved-draft-marker-${ Date.now() }`;

		await admin.createNewPost( { postType: 'post' } );
		await waitForEditorReady( page );
		const postId = await getCurrentPostId( page );

		await insertPostContent( { editor, marker, page, title } );
		await editor.saveDraft();

		const savedPost = await getPost( requestUtils, postId );
		expect( savedPost.status ).toBe( 'draft' );
		expect( rawField( savedPost.title ) ).toContain( title );
		expect( rawField( savedPost.content ) ).toContain( marker );

		await admin.visitAdminPage(
			'post.php',
			`post=${ postId }&action=edit`
		);
		await waitForEditorReady( page );

		await expect(
			editor.canvas.getByText( marker, { exact: true } )
		).toBeVisible( { timeout: 30_000 } );
	} );

	test( 'keeps saved new-draft content visible after a same-account auto-draft window was opened before saving', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		await setCollaboration( requestUtils, true );

		const title = `Same user saved draft ${ Date.now() }`;
		const marker = `same-user-saved-draft-marker-${ Date.now() }`;
		const utils = new CollaborationUtils( {
			admin,
			editor,
			page,
			requestUtils,
		} );

		try {
			await admin.createNewPost( { postType: 'post' } );
			await waitForEditorReady( page );
			const postId = await getCurrentPostId( page );

			await utils.joinCurrentUserSession( postId );
			await assertNoConnectionModal( page );
			await assertNoConnectionModal( utils.page2 );

			await insertPostContent( { editor, marker, page, title } );
			await editor.saveDraft();

			const savedPost = await getPost( requestUtils, postId );
			expect( savedPost.status ).toBe( 'draft' );
			expect( rawField( savedPost.title ) ).toContain( title );
			expect( rawField( savedPost.content ) ).toContain( marker );

			await page.reload( { waitUntil: 'domcontentloaded' } );
			await waitForEditorReady( page );
			await assertNoConnectionModal( page );

			await admin.visitAdminPage(
				'edit.php',
				new URLSearchParams( {
					post_status: 'draft',
					post_type: 'post',
					s: title,
				} ).toString()
			);
			await expect(
				page.getByRole( 'link', { exact: true, name: title } )
			).toBeVisible( { timeout: 30_000 } );

			await admin.visitAdminPage(
				'post.php',
				`post=${ postId }&action=edit`
			);
			await waitForEditorReady( page );

			await expect(
				editor.canvas.getByText( marker, { exact: true } )
			).toBeVisible( { timeout: 30_000 } );
		} finally {
			await utils.teardown();
		}
	} );
} );
