import { test as base, expect } from '@wordpress/e2e-test-utils-playwright';

interface OwnedRecord {
	id: number;
	author: number;
	status: string;
	title: { raw: string };
	content: { raw: string };
}

const savedPatternContent =
	'<!-- wp:paragraph --><p>Saved pattern content</p><!-- /wp:paragraph -->';
const savedPostParagraph =
	'<!-- wp:paragraph --><p>Saved post content</p><!-- /wp:paragraph -->';

const test = base.extend< {
	patternPost: { pattern: OwnedRecord; post: OwnedRecord };
} >( {
	patternPost: async ( { requestUtils }, use ) => {
		const ownedRecords: { record: OwnedRecord; endpoint: string }[] = [];
		try {
			const pattern = await requestUtils.rest< OwnedRecord >( {
				path: '/wp/v2/blocks',
				method: 'POST',
				data: {
					title: 'Save shortcut pattern regression',
					status: 'publish',
					content: savedPatternContent,
				},
			} );
			ownedRecords.push( { record: pattern, endpoint: 'blocks' } );
			const post = await requestUtils.rest< OwnedRecord >( {
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					title: 'Save shortcut post regression',
					status: 'draft',
					content: `${ savedPostParagraph }\n\n<!-- wp:block {"ref":${ pattern.id }} /-->`,
				},
			} );
			ownedRecords.push( { record: post, endpoint: 'posts' } );
			await use( { pattern, post } );
		} finally {
			for ( const { record, endpoint } of ownedRecords.reverse() ) {
				const current = await requestUtils.rest< OwnedRecord >( {
					path: `/wp/v2/${ endpoint }/${ record.id }`,
					params: { context: 'edit' },
				} );
				expect( current.author ).toBe( record.author );
				expect( current.title.raw ).toBe( record.title.raw );
				await requestUtils.rest( {
					path: `/wp/v2/${ endpoint }/${ record.id }`,
					method: 'DELETE',
					params: { force: true },
				} );
			}
		}
	},
} );

test.describe( 'Saving synced patterns with the keyboard', () => {
	test.beforeEach(
		async ( { patternPost, requestUtils, admin, editor, page } ) => {
			await requestUtils.setPreferences( 'core/edit-post', {
				welcomeGuide: false,
			} );
			await requestUtils.setPreferences( 'core', {
				editorMode: 'visual',
			} );
			await admin.visitAdminPage(
				'post.php',
				`post=${ patternPost.post.id }&action=edit`
			);
			const patternBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
				exact: true,
			} );
			await expect( patternBlock ).toContainText(
				'Saved pattern content'
			);
			await patternBlock.click();
			await editor.clickBlockToolbarButton( 'Edit original' );
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getCurrentPostType()
					)
				)
				.toBe( 'wp_block' );
			const patternParagraph = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
				exact: true,
			} );
			await expect( patternParagraph ).toHaveText(
				'Saved pattern content'
			);
			await patternParagraph.click();
			await patternParagraph.press( 'End' );
			await patternParagraph.pressSequentially( ' edited' );
			await expect( patternParagraph ).toHaveText(
				'Saved pattern content edited'
			);
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();
			await expect
				.poll( () =>
					page.evaluate( () => {
						const store = window.wp.data.select( 'core/editor' );
						return {
							type: store.getCurrentPostType(),
							postDirty: store.isEditedPostDirty(),
							otherEntitiesDirty: store.hasNonPostEntityChanges(),
						};
					} )
				)
				.toEqual( {
					type: 'post',
					postDirty: false,
					otherEntitiesDirty: true,
				} );
		}
	);

	test( 'saves a changed synced pattern when the post itself is unchanged', async ( {
		patternPost,
		page,
		pageUtils,
		requestUtils,
		editor,
	} ) => {
		const dialog = page.getByRole( 'dialog', {
			name: 'Are you ready to save?',
		} );
		await pageUtils.pressKeys( 'primary+s' );
		await expect( dialog ).toBeVisible();
		await expect(
			dialog.getByRole( 'checkbox', {
				name: patternPost.pattern.title.raw,
				exact: true,
			} )
		).toBeChecked();
		await expect( dialog.getByRole( 'checkbox' ) ).toHaveCount( 1 );

		// Opening or cancelling the chooser must not save the pattern.
		const beforeSave = await requestUtils.rest< OwnedRecord >( {
			path: `/wp/v2/blocks/${ patternPost.pattern.id }`,
			params: { context: 'edit' },
		} );
		expect( beforeSave.content.raw ).toBe( savedPatternContent );
		await dialog
			.getByRole( 'button', { name: 'Cancel', exact: true } )
			.click();
		await expect( dialog ).toBeHidden();
		await pageUtils.pressKeys( 'primary+s' );
		await expect( dialog ).toBeVisible();
		await pageUtils.pressKeys( 'primary+s' );
		await expect( dialog ).toBeVisible();
		await expect( dialog.getByRole( 'checkbox' ) ).toHaveCount( 1 );
		await dialog
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await expect( dialog ).toBeHidden();
		await expect
			.poll( async () => {
				const saved = await requestUtils.rest< OwnedRecord >( {
					path: `/wp/v2/blocks/${ patternPost.pattern.id }`,
					params: { context: 'edit' },
				} );
				return saved.content.raw;
			} )
			.toContain( 'Saved pattern content edited' );
		const savedPost = await requestUtils.rest< OwnedRecord >( {
			path: `/wp/v2/posts/${ patternPost.post.id }`,
			params: { context: 'edit' },
		} );
		expect( savedPost.content.raw ).toBe( patternPost.post.content.raw );
		await page.reload();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
				exact: true,
			} )
		).toContainText( 'Saved pattern content edited' );
	} );

	test( 'preserves the selected entities when the save shortcut is repeated', async ( {
		patternPost,
		page,
		pageUtils,
		requestUtils,
		editor,
	} ) => {
		const postParagraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph', exact: true } )
			.filter( { hasText: 'Saved post content' } );
		await expect( postParagraph ).toHaveText( 'Saved post content' );
		await postParagraph.focus();
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).getCurrentPostType()
				)
			)
			.toBe( 'post' );
		await postParagraph.press( 'End' );
		await postParagraph.pressSequentially( ' edited' );
		await expect( postParagraph ).toHaveText( 'Saved post content edited' );
		const dialog = page.getByRole( 'dialog', {
			name: 'Are you ready to save?',
		} );
		// Start with the normal Save button's chooser, including its existing
		// publication continuation, then use the shortcut while it is open.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await expect( dialog ).toBeVisible();
		const postCheckbox = dialog.getByRole( 'checkbox', {
			name: patternPost.post.title.raw,
			exact: true,
		} );
		await expect( dialog.getByRole( 'checkbox' ) ).toHaveCount( 2 );
		await postCheckbox.uncheck();
		await pageUtils.pressKeys( 'primary+s' );
		await expect( dialog ).toBeVisible();
		await expect( postCheckbox ).not.toBeChecked();
		const beforeSave = await requestUtils.rest< OwnedRecord >( {
			path: `/wp/v2/posts/${ patternPost.post.id }`,
			params: { context: 'edit' },
		} );
		expect( beforeSave.content.raw ).toBe( patternPost.post.content.raw );
		await dialog
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await expect( dialog ).toBeHidden();
		const savedPattern = await requestUtils.rest< OwnedRecord >( {
			path: `/wp/v2/blocks/${ patternPost.pattern.id }`,
			params: { context: 'edit' },
		} );
		expect( savedPattern.content.raw ).toContain(
			'Saved pattern content edited'
		);
		const unchangedPost = await requestUtils.rest< OwnedRecord >( {
			path: `/wp/v2/posts/${ patternPost.post.id }`,
			params: { context: 'edit' },
		} );
		expect( unchangedPost.content.raw ).toBe(
			patternPost.post.content.raw
		);
		await expect
			.poll( () =>
				page.evaluate( () => {
					const store = window.wp.data.select( 'core/editor' );
					return {
						postDirty: store.isEditedPostDirty(),
						otherEntitiesDirty: store.hasNonPostEntityChanges(),
					};
				} )
			)
			.toEqual( { postDirty: true, otherEntitiesDirty: false } );

		// With only the post left dirty, retain the ordinary direct-save shortcut.
		await pageUtils.pressKeys( 'primary+s' );
		await expect( dialog ).toBeHidden();
		await expect
			.poll( async () => {
				const saved = await requestUtils.rest< OwnedRecord >( {
					path: `/wp/v2/posts/${ patternPost.post.id }`,
					params: { context: 'edit' },
				} );
				return saved.content.raw;
			} )
			.toContain( 'Saved post content edited' );
		await page.reload();
		await expect( postParagraph ).toHaveText( 'Saved post content edited' );
	} );
} );
