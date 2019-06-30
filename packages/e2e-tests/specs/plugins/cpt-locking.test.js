/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockToolbarButton,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	insertBlock,
	pressKeyTimes,
	setPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'cpt locking', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-cpt-locking' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-cpt-locking' );
	} );

	const shouldRemoveTheInserter = async () => {
		expect(
			await page.$( '.edit-post-header [aria-label="Add block"]' )
		).toBeNull();
	};

	const shouldNotAllowBlocksToBeRemoved = async () => {
		await page.type( '.editor-rich-text__editable.wp-block-paragraph', 'p1' );
		await clickBlockToolbarButton( 'More options' );
		expect(
			await page.$x( '//button[contains(text(), "Remove Block")]' )
		).toHaveLength( 0 );
	};

	const shouldAllowBlocksToBeMoved = async () => {
		await page.click( '.editor-rich-text__editable.wp-block-paragraph' );
		expect(
			await page.$( 'button[aria-label="Move up"]' )
		).not.toBeNull();
		await page.click( 'button[aria-label="Move up"]' );
		await page.type( '.editor-rich-text__editable.wp-block-paragraph', 'p1' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	};

	describe( 'template_lock all', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'locked-all-post' } );
		} );

		it( 'should remove the inserter', shouldRemoveTheInserter );

		it( 'should not allow blocks to be removed', shouldNotAllowBlocksToBeRemoved );

		it( 'should not allow blocks to be moved', async () => {
			await page.click( '.editor-rich-text__editable.wp-block-paragraph' );
			expect(
				await page.$( 'button[aria-label="Move up"]' )
			).toBeNull();
		} );

		it( 'should not error when deleting the cotents of a paragraph', async () => {
			await page.click( '.block-editor-block-list__block[data-type="core/paragraph"] p' );
			const textToType = 'Paragraph';
			await page.keyboard.type( 'Paragraph' );
			await pressKeyTimes( 'Backspace', textToType.length + 1 );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should show invalid template notice if the blocks do not match the templte', async () => {
			const content = await getEditedPostContent();
			const [ , contentWithoutImage ] = content.split( '<!-- /wp:image -->' );
			await setPostContent( contentWithoutImage );
			const VALIDATION_PARAGRAPH_SELECTOR = '.editor-template-validation-notice .components-notice__content p';
			await page.waitForSelector( VALIDATION_PARAGRAPH_SELECTOR );
			expect(
				await page.evaluate(
					( element ) => element.textContent,
					await page.$( VALIDATION_PARAGRAPH_SELECTOR )
				)
			).toEqual( 'The content of your post doesn’t match the template assigned to your post type.' );
		} );
	} );

	describe( 'template_lock insert', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'locked-insert-post' } );
		} );

		it( 'should remove the inserter', shouldRemoveTheInserter );

		it( 'should not allow blocks to be removed', shouldNotAllowBlocksToBeRemoved );

		it( 'should allow blocks to be moved', shouldAllowBlocksToBeMoved );
	} );

	describe( 'template_lock false', () => {
		beforeEach( async () => {
			await createNewPost( { postType: 'not-locked-post' } );
		} );

		it( 'should allow blocks to be inserted', async () => {
			expect(
				await page.$( '.edit-post-header [aria-label="Add block"]' )
			).not.toBeNull();
			await insertBlock( 'List' );
			await page.keyboard.type( 'List content' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should allow blocks to be removed', async () => {
			await page.type( '.editor-rich-text__editable.wp-block-paragraph', 'p1' );
			await clickBlockToolbarButton( 'More options' );
			const [ removeBlock ] = await page.$x( '//button[contains(text(), "Remove Block")]' );
			await removeBlock.click();
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'should allow blocks to be moved', shouldAllowBlocksToBeMoved );
	} );
} );
